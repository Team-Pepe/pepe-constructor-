// Endpoint para obtener configuración de Supabase para el cliente
router.get('/api/storage-config', (req, res) => {
  // Extraer solo el ID del proyecto de la URL completa
  const supabaseUrl = process.env.SUPABASE_URL || '';
  let projectId = '';
  
  try {
    // La URL tendrá el formato: https://[project-id].supabase.co
    const urlObj = new URL(supabaseUrl);
    projectId = urlObj.hostname.split('.')[0];
  } catch (error) {
    console.error('Error al parsear SUPABASE_URL:', error);
  }
  
  // Devolver solo la información necesaria para el cliente
  // No compartir claves sensibles de admin, solo la anon key
  res.json({
    projectId,
    bucketName: process.env.BUCKET_NAME || 'images',
    anonKey: process.env.SUPABASE_KEY
  });
}); 