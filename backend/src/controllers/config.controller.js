// Obtener la configuración de Supabase Storage para el cliente
exports.getStorageConfig = (req, res) => {
  try {
    // Extraer el projectId de la URL de Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    let projectId = '';
    
    try {
      const url = new URL(supabaseUrl);
      // La estructura típica es: https://[projectId].supabase.co
      projectId = url.hostname.split('.')[0];
    } catch (error) {
      console.error('Error al parsear la URL de Supabase:', error);
    }
    
    // Nombre del bucket desde variable de entorno
    const bucket = process.env.SUPABASE_BUCKET;
    
    // Responder con la configuración
    res.json({
      projectId,
      bucket,
      supabaseKey: process.env.SUPABASE_KEY
    });
  } catch (error) {
    console.error('Error al obtener configuración de Supabase:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener configuración de Supabase' 
    });
  }
}; 