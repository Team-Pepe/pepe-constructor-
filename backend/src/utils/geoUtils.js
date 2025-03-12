/**
 * Utilidades para trabajar con datos geoespaciales
 */

/**
 * Convierte coordenadas de latitud y longitud a un formato WKT (Well-Known Text) para PostGIS
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @param {number} srid - Sistema de referencia espacial ID (por defecto 4326 para WGS84)
 * @returns {string} - Representación WKT del punto
 */
function pointToWKT(lat, lng, srid = 4326) {
  return `SRID=${srid};POINT(${lng} ${lat})`;
}

/**
 * Extrae coordenadas de latitud y longitud de una representación WKT
 * @param {string} wkt - Representación WKT del punto
 * @returns {Object} - Objeto con propiedades lat y lng
 */
function wktToPoint(wkt) {
  // Ejemplo de formato: "SRID=4326;POINT(-77.042793 -12.046374)"
  try {
    // Extraer la parte POINT(lng lat)
    const pointPart = wkt.split(';')[1] || wkt;
    // Extraer las coordenadas
    const coordsMatch = pointPart.match(/POINT\(([^ ]+) ([^)]+)\)/);
    
    if (coordsMatch && coordsMatch.length === 3) {
      return {
        lng: parseFloat(coordsMatch[1]),
        lat: parseFloat(coordsMatch[2])
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error al parsear WKT:', error);
    return null;
  }
}

/**
 * Calcula la distancia entre dos puntos en metros
 * Esta función genera una consulta SQL para PostGIS
 * @param {string} point1 - Representación WKT del primer punto
 * @param {string} point2 - Representación WKT del segundo punto
 * @returns {string} - Consulta SQL para calcular la distancia
 */
function distanceQuery(point1, point2) {
  return `
    SELECT ST_Distance(
      ST_GeomFromText('${point1}', 4326)::geography,
      ST_GeomFromText('${point2}', 4326)::geography
    ) AS distance_meters
  `;
}

/**
 * Genera una consulta SQL para encontrar puntos dentro de un radio
 * @param {string} centerPoint - Representación WKT del punto central
 * @param {number} radiusMeters - Radio en metros
 * @returns {string} - Consulta SQL para encontrar puntos dentro del radio
 */
function pointsWithinRadiusQuery(centerPoint, radiusMeters) {
  return `
    ST_DWithin(
      location::geography,
      ST_GeomFromText('${centerPoint}', 4326)::geography,
      ${radiusMeters}
    )
  `;
}

module.exports = {
  pointToWKT,
  wktToPoint,
  distanceQuery,
  pointsWithinRadiusQuery
}; 