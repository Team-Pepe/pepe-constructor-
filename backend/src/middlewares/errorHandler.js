/**
 * Middleware para manejo global de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error en la aplicación:', err);
  
  // Determinar el código de estado HTTP (500 por defecto)
  const statusCode = err.statusCode || 500;
  
  // Enviar respuesta de error
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Se produjo un error interno en el servidor',
    // Solo incluir detalles del error en desarrollo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler; 