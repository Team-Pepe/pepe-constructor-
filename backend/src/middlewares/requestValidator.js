/**
 * Middleware para validar datos de entrada
 * @param {Object} schema - Schema de validación (puede ser Joi, Yup, etc.)
 */
const requestValidator = (schema) => {
  return (req, res, next) => {
    try {
      // Se puede implementar con diferentes bibliotecas de validación
      const dataToValidate = req.method === 'GET' ? req.query : req.body;
      
      // Realizar validación 
      const { error, value } = schema.validate(dataToValidate);
      
      if (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Datos de entrada inválidos',
          details: error.details.map(err => err.message)
        });
      }
      
      // Si pasa la validación, continuar
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = requestValidator; 