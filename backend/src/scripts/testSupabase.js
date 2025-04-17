require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BUCKET_NAME = 'images';

// Verificar variables de entorno
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_KEY son requeridas.');
  console.error('Agrega estas variables a tu archivo .env');
  process.exit(1);}

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Función para verificar si un bucket existe
async function checkBucket() {
  try {
    console.log('📊 Verificando conexión con Supabase...');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error al listar buckets:', error);
      return false;
    }
    
    console.log('✅ Conexión con Supabase establecida correctamente');
    console.log('📋 Buckets disponibles:', buckets.map(b => b.name).join(', ') || 'Ninguno');
    
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    
    if (bucketExists) {
      console.log(`✅ Bucket "${BUCKET_NAME}" existe`);
      return true;
    } else {
      console.log(`❌ Bucket "${BUCKET_NAME}" no existe`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar bucket:', error);
    return false;
  }
}

// Versión simplificada para testSupabase.js
const uploadTestFile = async () => {
  try {
    // Crear un archivo de prueba simple
    const testFileContent = Buffer.from('Este es un archivo de prueba para Supabase Storage');
    
    console.log('📤 Subiendo archivo de prueba...');
    
    // Usar exactamente el mismo método que funciona en tu API
    const { data, error } = await supabase.storage
      .from('materials') // Asegúrate de que sea el mismo nombre de bucket que funciona en Swagger
      .upload('test/test-file.txt', testFileContent, {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (error) {
      console.error('❌ Error al subir archivo de prueba:', error);
      return false;
    }
    
    // Si llegamos aquí, la carga fue exitosa
    console.log('✅ Archivo de prueba subido correctamente');
    
    // Intenta obtener la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('materials')
      .getPublicUrl('test/test-file.txt');
      
    console.log('🔗 URL del archivo:', publicUrl);
    
    return true;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
};

// Función principal simplificada
const runTests = async () => {
  console.log('======================================');
  console.log('🧪 INICIANDO PRUEBAS DE SUPABASE STORAGE');
  console.log('======================================');
  
  const uploadSuccess = await uploadTestFile();
  
  if (uploadSuccess) {
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
  } else {
    console.log('❌ ALGUNAS PRUEBAS FALLARON');
  }
};

runTests(); 