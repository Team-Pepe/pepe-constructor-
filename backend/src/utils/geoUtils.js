/**
 * Utilidades para trabajar con datos geoespaciales
 */

/**
 * Calcula la distancia entre dos puntos en metros usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lng1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lng2 - Longitud del segundo punto
 * @returns {number} - Distancia en metros
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d; // Distancia en metros
}

/**
 * Verifica si un punto está dentro de un radio específico
 * @param {number} centerLat - Latitud del punto central
 * @param {number} centerLng - Longitud del punto central
 * @param {number} pointLat - Latitud del punto a verificar
 * @param {number} pointLng - Longitud del punto a verificar
 * @param {number} radiusMeters - Radio en metros
 * @returns {boolean} - true si el punto está dentro del radio
 */
function isPointWithinRadius(centerLat, centerLng, pointLat, pointLng, radiusMeters) {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusMeters;
}

/**
 * Genera una consulta SQL para calcular la distancia entre dos puntos
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lng1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lng2 - Longitud del segundo punto
 * @returns {string} - Consulta SQL para calcular la distancia
 */
function distanceQuery(lat1, lng1, lat2, lng2) {
  return `
    SELECT 
      (
        6371 * acos(
          cos(radians(${lat1})) * 
          cos(radians(latitud)) * 
          cos(radians(longitud) - radians(${lng1})) + 
          sin(radians(${lat1})) * 
          sin(radians(latitud))
        ) * 1000
      ) AS distance_meters
  `;
}

/**
 * Genera una consulta SQL para encontrar puntos dentro de un radio
 * @param {number} centerLat - Latitud del punto central
 * @param {number} centerLng - Longitud del punto central
 * @param {number} radiusMeters - Radio en metros
 * @returns {string} - Consulta SQL para encontrar puntos dentro del radio
 */
function pointsWithinRadiusQuery(centerLat, centerLng, radiusMeters) {
  return `
    (
      6371 * acos(
        cos(radians(${centerLat})) * 
        cos(radians(latitud)) * 
        cos(radians(longitud) - radians(${centerLng})) + 
        sin(radians(${centerLat})) * 
        sin(radians(latitud))
      ) * 1000
    ) <= ${radiusMeters}
  `;
}

module.exports = {
  calculateDistance,
  isPointWithinRadius,
  distanceQuery,
  pointsWithinRadiusQuery
}; 