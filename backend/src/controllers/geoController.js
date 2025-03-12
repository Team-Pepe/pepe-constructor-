const { prisma } = require('../config/db');
const { pointToWKT, wktToPoint } = require('../utils/geoUtils');

/**
 * Controlador para operaciones geoespaciales
 */
const geoController = {
  /**
   * Registra la ubicación de un usuario (check-in)
   */
  async checkIn(req, res) {
    try {
      const { userId, lat, lng } = req.body;
      
      if (!userId || !lat || !lng) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Se requiere userId, lat y lng' 
        });
      }

      // Convertir coordenadas a formato WKT
      const locationWKT = pointToWKT(parseFloat(lat), parseFloat(lng));
      
      // Crear registro de asistencia
      const attendance = await prisma.Attendance.create({
        data: {
          userId: parseInt(userId),
          checkIn: new Date(),
          location: locationWKT
        }
      });
      
      res.json({
        status: 'success',
        message: 'Check-in registrado correctamente',
        data: {
          id: attendance.id,
          userId: attendance.userId,
          checkIn: attendance.checkIn,
          location: {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
          }
        }
      });
    } catch (error) {
      console.error('Error al registrar check-in:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error al registrar check-in' 
      });
    }
  },

  /**
   * Registra la salida de un usuario (check-out)
   */
  async checkOut(req, res) {
    try {
      const { attendanceId } = req.params;
      
      if (!attendanceId) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Se requiere el ID de asistencia' 
        });
      }

      // Actualizar registro de asistencia
      const attendance = await prisma.Attendance.update({
        where: { id: parseInt(attendanceId) },
        data: {
          checkOut: new Date()
        }
      });
      
      res.json({
        status: 'success',
        message: 'Check-out registrado correctamente',
        data: attendance
      });
    } catch (error) {
      console.error('Error al registrar check-out:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error al registrar check-out' 
      });
    }
  },

  /**
   * Obtiene los registros de asistencia de un usuario
   */
  async getUserAttendance(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Se requiere el ID del usuario' 
        });
      }

      // Obtener registros de asistencia
      const attendances = await prisma.Attendance.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { checkIn: 'desc' }
      });
      
      // Transformar las ubicaciones de WKT a coordenadas
      const formattedAttendances = attendances.map(attendance => {
        const locationPoint = attendance.location ? wktToPoint(attendance.location) : null;
        
        return {
          ...attendance,
          location: locationPoint
        };
      });
      
      res.json(formattedAttendances);
    } catch (error) {
      console.error('Error al obtener registros de asistencia:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error al obtener registros de asistencia' 
      });
    }
  },

  /**
   * Obtiene los usuarios que están actualmente en una ubicación específica
   * dentro de un radio determinado
   */
  async getUsersNearby(req, res) {
    try {
      const { lat, lng, radius = 1000 } = req.query; // Radio en metros, por defecto 1km
      
      if (!lat || !lng) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Se requieren las coordenadas (lat, lng)' 
        });
      }

      // Convertir coordenadas a formato WKT
      const centerPoint = pointToWKT(parseFloat(lat), parseFloat(lng));
      
      // Ejecutar consulta SQL directa para usar funciones de PostGIS
      const usersNearby = await prisma.$queryRaw`
        SELECT a.id, a.user_id, a.check_in, a.check_out, u.email, u.username,
               ST_AsText(a.location) as location_text,
               ST_Distance(
                 a.location::geography, 
                 ST_GeomFromText(${centerPoint}, 4326)::geography
               ) as distance
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.check_out IS NULL
        AND ST_DWithin(
          a.location::geography,
          ST_GeomFromText(${centerPoint}, 4326)::geography,
          ${parseFloat(radius)}
        )
        ORDER BY distance
      `;
      
      res.json(usersNearby);
    } catch (error) {
      console.error('Error al obtener usuarios cercanos:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error al obtener usuarios cercanos' 
      });
    }
  }
};

module.exports = geoController; 