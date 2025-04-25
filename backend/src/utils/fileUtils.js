const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const tus = require('tus-js-client');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_PROJECT_ID = SUPABASE_URL ? SUPABASE_URL.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] : null;

// Verificar si las variables de entorno están definidas
if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_PROJECT_ID) {
  console.error('❌ Error: Variables de entorno de Supabase son requeridas.');
  console.error('SUPABASE_URL y SUPABASE_ANON_KEY deben estar definidas en tu archivo .env');
  console.error('SUPABASE_URL debe tener el formato: https://[project-id].supabase.co');
} else {
  console.log('✅ Configuración de Supabase cargada correctamente.');
  console.log(`📊 URL de Supabase: ${SUPABASE_URL}`);
  console.log(`🔑 Project ID: ${SUPABASE_PROJECT_ID}`);
}

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Nombre del bucket en Supabase Storage
const BUCKET_NAME = 'materials'; // Cambiado a 'materials' para mantener consistencia

// Endpoint para cargas resumibles
const RESUMABLE_UPLOAD_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/upload/resumable`;

// Directorio temporal para almacenar archivos durante el procesamiento
const TMP_DIR = path.join(os.tmpdir(), 'pepe-constructor-uploads');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Configuración de multer para usar memoryStorage (guardar en memoria, no en disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 25 * 1024 * 1024, // 25 MB
    fileSize: 25 * 1024 * 1024 // 25 MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

/**
 * Comprime una imagen usando sharp
 * @param {Buffer} buffer - Buffer de la imagen a comprimir
 * @returns {Promise<Buffer>} - Buffer de la imagen comprimida
 */
const compressImage = async (buffer) => {
  try {
    return await sharp(buffer)
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch (error) {
    console.error('❌ Error al comprimir imagen:', error);
    throw error;
  }
};

/**
 * Comprime un archivo usando gzip
 * @param {Buffer} buffer - Buffer del archivo a comprimir
 * @returns {Promise<Buffer>} - Buffer del archivo comprimido
 */
const compressFile = async (buffer) => {
  return new Promise((resolve, reject) => {
    zlib.gzip(buffer, (err, compressedBuffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(compressedBuffer);
      }
    });
  });
};

/**
 * Sube un archivo a Supabase Storage usando el protocolo TUS (resumable uploads)
 * @param {Object} file - Objeto file de multer (debe contener buffer o path)
 * @param {String} folder - Carpeta donde guardar el archivo
 * @returns {Promise<Object>} - Información del archivo subido
 */
const uploadFileToSupabase = async (file, folder = '') => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!file) {
        return reject(new Error('No se proporcionó ningún archivo'));
      }

      // Verificar tamaño máximo
      const MAX_FILE_SIZE_MB = 50;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
      if (file.size >= MAX_FILE_SIZE_BYTES) {
        return reject(new Error(`El archivo es demasiado grande. El tamaño máximo permitido es ${MAX_FILE_SIZE_MB} MB.`));
      }

      // Comprimir la imagen si es necesario y guardar en buffer
      let fileBuffer;
      if (file.mimetype.startsWith('image/')) {
        fileBuffer = await compressImage(file.buffer);
        console.log('✅ Imagen comprimida');
      } else {
        fileBuffer = file.buffer;
      }

      // Generar nombre único para el archivo
      const fileName = folder 
        ? `${folder}/${uuidv4()}-${file.originalname.replace(/\s+/g, '_')}`
        : `${uuidv4()}-${file.originalname.replace(/\s+/g, '_')}`;

      console.log(`📤 Preparando subida a Supabase: ${fileName}`);

      // Guardar el buffer en un archivo temporal
      const tmpFilePath = path.join(TMP_DIR, `${uuidv4()}-${file.originalname}`);
      fs.writeFileSync(tmpFilePath, fileBuffer);

      // Crear el uploader de TUS para subida resumible
      const upload = new tus.Upload(fs.createReadStream(tmpFilePath), {
        endpoint: RESUMABLE_UPLOAD_URL,
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize: 6 * 1024 * 1024, // 6MB chunks
        uploadDataDuringCreation: true,
        headers: {
          authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
        },
        metadata: {
          bucketName: BUCKET_NAME,
          objectName: fileName,
          contentType: file.mimetype,
          cacheControl: '3600'
        },
        onError: (error) => {
          console.error('❌ Error durante la subida a Supabase:', error);
          fs.unlinkSync(tmpFilePath); // Eliminar archivo temporal
          reject(error);
        },
        onSuccess: () => {
          console.log('✅ Archivo subido exitosamente a Supabase');
          fs.unlinkSync(tmpFilePath); // Eliminar archivo temporal

          // Obtener la URL pública del archivo
          const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

          resolve({
            success: true,
            fileName: fileName,
            url: publicUrl
          });
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          console.log(`📊 Progreso: ${percentage}% (${bytesUploaded}/${bytesTotal} bytes)`);
        },
      });

      // Iniciar la subida
      upload.start();
    } catch (error) {
      console.error('❌ Error en uploadFileToSupabase:', error);
      reject(error);
    }
  });
};

/**
 * Elimina un archivo de Supabase Storage
 * @param {String} fileName - Nombre del archivo o URL completa
 * @returns {Promise<Boolean>} - Resultado de la operación
 */
const deleteFileFromSupabase = async (fileName) => {
  try {
    // Si la URL es completa, extraer solo el nombre del archivo
    if (fileName && fileName.startsWith('http')) {
      const url = new URL(fileName);
      const pathParts = url.pathname.split('/');
      // Obtener la parte después de 'object/public/[bucket]/'
      const startIndex = pathParts.indexOf('object');
      if (startIndex !== -1 && startIndex + 3 < pathParts.length) {
        fileName = pathParts.slice(startIndex + 3).join('/');
      } else {
        throw new Error('No se pudo extraer el nombre del archivo de la URL');
      }
    }
    
    if (!fileName) {
      throw new Error('Nombre de archivo no proporcionado');
    }
    
    console.log(`🗑️ Eliminando archivo de Supabase: ${fileName}`);
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);
      
    if (error) {
      console.error('❌ Error al eliminar archivo de Supabase:', error);
      throw error;
    }
    
    console.log('✅ Archivo eliminado exitosamente de Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error en deleteFileFromSupabase:', error);
    return false;
  }
};

/**
 * Procesa y sube una imagen a Supabase
 * @param {Object} file - Objeto file de multer
 * @param {String} folder - Carpeta donde guardar la imagen
 * @returns {Promise<Object>} - Información de la imagen procesada
 */
const processImage = async (file, folder = '') => {
  try {
    if (!file) {
      return { success: false, message: 'No se proporcionó ningún archivo' };
    }

    const result = await uploadFileToSupabase(file, folder);
    return result;
  } catch (error) {
    console.error('❌ Error al procesar imagen:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Guarda un archivo en Supabase Storage
 * @param {Object} file - Objeto file de multer
 * @param {String} folder - Carpeta donde guardar el archivo
 * @returns {Promise<Object>} - Información del archivo guardado
 */
const saveFile = async (file, folder = '') => {
  try {
    const result = await processImage(file, folder);
    if (!result.success) {
      throw new Error(result.message || 'Error al procesar el archivo');
    }
    return result;
  } catch (error) {
    console.error('❌ Error en saveFile:', error);
    return { success: false, message: error.message };
  }
};

// Inicializar el bucket en Supabase si no existe
const initSupabaseBucket = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ No se puede inicializar el bucket de Supabase: Credenciales no configuradas');
    return;
  }
  
  try {
    console.log('🔄 Verificando bucket de Supabase...');
    
    // Verificar si el bucket existe
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error al listar buckets en Supabase:', error);
      return;
    }
    
    console.log('📋 Buckets disponibles:', buckets.map(b => b.name).join(', ') || 'Ninguno');
    
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      // Crear el bucket si no existe
      console.log(`🪣 Creando bucket "${BUCKET_NAME}" en Supabase...`);
      
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true // Hacer el bucket público
      });
      
      if (createError) {
        console.error(`❌ Error al crear bucket "${BUCKET_NAME}":`, createError);
      } else {
        console.log(`✅ Bucket "${BUCKET_NAME}" creado exitosamente`);
        
        // Establecer políticas de acceso público
        try {
          const { data, error: policyError } = await supabase.rpc('create_storage_policy', {
            bucket_id: BUCKET_NAME,
            policy_name: 'allow_public_access',
            definition: {
              name: 'allow_public_access',
              action: 'SELECT',
              role: 'anon',
              bucket_id: BUCKET_NAME,
              check: {}
            }
          });
          
          if (policyError) {
            console.error('⚠️ No se pudieron establecer políticas de acceso:', policyError);
          } else {
            console.log('✅ Políticas de acceso público configuradas');
          }
        } catch (policyError) {
          console.error('⚠️ Error al configurar políticas:', policyError);
        }
      }
    } else {
      console.log(`✅ Bucket "${BUCKET_NAME}" ya existe en Supabase`);
    }
  } catch (error) {
    console.error('❌ Error al inicializar bucket en Supabase:', error);
  }
};

// Inicializar el bucket al cargar el módulo
initSupabaseBucket();

module.exports = {
  upload,
  processImage,
  deleteFile: deleteFileFromSupabase,
  compressImage,
  compressFile,
  uploadFileToSupabase,
  deleteFileFromSupabase,
  saveFile, // Exportando la función saveFile
  BUCKET_NAME,
  SUPABASE_KEY,
  SUPABASE_PROJECT_ID
};