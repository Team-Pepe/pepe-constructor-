/**
 * Validación de números
 */
exports.isValidNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num);
};

/**
 * Validación de IDs
 */
exports.isValidId = (id) => {
  if (!id) return false;
  const parsedId = parseInt(id, 10);
  return !isNaN(parsedId) && parsedId > 0;
};

/**
 * Validación de coordenadas
 */
exports.isValidCoordinate = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  return !isNaN(latitude) && 
         !isNaN(longitude) && 
         latitude >= -90 && 
         latitude <= 90 && 
         longitude >= -180 && 
         longitude <= 180;
}; 