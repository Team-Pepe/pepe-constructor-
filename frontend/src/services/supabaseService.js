import { createClient } from '@supabase/supabase-js';

// Obtener las credenciales de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://deveoqcczffdpsjopgwg.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldmVvcWNjemZmZHBzam9wZ3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NDk3MjcsImV4cCI6MjA1NzMyNTcyN30.D7J00n-iaoz2WMgTQCylEPfC7dySFdYtAiBeTxCGepw";
const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET || "images";
const FOLDER_NAME = "materials";

// Crear el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función auxiliar para construir URL de imagen
export const getImageUrl = (fileName) => {
  if (!fileName) return null;
  
  // Si ya es una URL completa, devolverla directamente
  if (fileName.startsWith('http')) {
    return fileName;
  }
  
  // Construir URL de Supabase Storage incluyendo la carpeta materials
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${FOLDER_NAME}/${fileName}`;
};

/**
 * Verifica la conexión a Supabase
 * @returns {Promise<{ success: boolean, message: string }>} Resultado de la verificación
 */
export const checkSupabaseConnection = async () => {
  try {
    // Verificar que podemos listar buckets (permiso básico)
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error al conectar con Supabase:', error);
      return { 
        success: false, 
        message: `Error al conectar con Supabase: ${error.message}` 
      };
    }
    
    console.log('Conexión a Supabase establecida');
    
    // Verificar si podemos listar archivos del bucket en la carpeta materials
    const { data: fileList, error: fileError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(FOLDER_NAME);
      
    if (fileError) {
      console.error(`Error al acceder al bucket "${BUCKET_NAME}/${FOLDER_NAME}":`, fileError);
      return {
        success: false,
        message: `Error al acceder al bucket "${BUCKET_NAME}/${FOLDER_NAME}": ${fileError.message}`
      };
    }
    
    console.log(`Archivos en el bucket "${BUCKET_NAME}/${FOLDER_NAME}":`, fileList);
    return { 
      success: true, 
      message: `Conexión a Supabase exitosa, bucket "${BUCKET_NAME}/${FOLDER_NAME}" accesible` 
    };
  } catch (error) {
    console.error('Error al conectar con Supabase:', error);
    return { 
      success: false, 
      message: `Error al conectar con Supabase: ${error.message}` 
    };
  }
};

/**
 * Sube una imagen a Supabase Storage
 * @param {File} file - El archivo a subir
 * @returns {Promise<{ url: string } | { error: string }>} La URL de la imagen o un error
 */
export const uploadImage = async (file) => {
  try {
    // Validar que el archivo sea una imagen
    if (!file || !file.type.startsWith('image/')) {
      return { error: 'El archivo debe ser una imagen' };
    }

    // Crear un nombre único para el archivo
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = `${FOLDER_NAME}/${fileName}`;

    console.log('Intentando subir archivo:', filePath);

    // Subir el archivo a Supabase Storage en la carpeta materials
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error al subir la imagen a Supabase:', error);
      return { error: error.message };
    }

    console.log('Archivo subido correctamente:', data);

    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('URL pública generada:', publicUrl);

    return { url: publicUrl };
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    return { error: error.message };
  }
};

/**
 * Elimina una imagen de Supabase Storage
 * @param {string} url - La URL de la imagen a eliminar
 * @returns {Promise<{ success: boolean, error?: string }>} Resultado de la operación
 */
export const deleteImage = async (url) => {
  try {
    // Extraer el nombre del archivo de la URL
    const urlParts = url.split('/');
    const fileName = urlParts.pop();
    const filePath = `${FOLDER_NAME}/${fileName}`;
    
    if (!fileName) {
      return { success: false, error: 'URL de imagen inválida' };
    }

    console.log('Intentando eliminar archivo:', filePath);

    // Eliminar el archivo de la carpeta materials
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error al eliminar la imagen de Supabase:', error);
      return { success: false, error: error.message };
    }

    console.log('Archivo eliminado correctamente');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar la imagen:', error);
    return { success: false, error: error.message };
  }
};

// Verificar la conexión al cargar el servicio (solo en desarrollo)
if (import.meta.env.DEV) {
  checkSupabaseConnection()
    .then(result => {
      console.log(result.message);
    });
}

export default supabase; 