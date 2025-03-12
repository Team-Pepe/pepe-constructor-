const { prisma } = require('../config/db');
const { calculateDistance, isPointWithinRadius } = require('../utils/geoUtils');

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

      // Crear registro de asistencia con latitud y longitud
      const attendance = await prisma.Attendance.create({
        data: {
          userId: parseInt(userId),
          checkIn: new Date(),
          latitud: parseFloat(lat),
          longitud: parseFloat(lng)
        }
      });
      
      res.json({
        status: 'success',
        message: 'Check-in registrado correctamente',
        data: {
          id: attendance.id,
          userId: attendance.userId,
          checkIn: attendance.checkIn,
          latitud: attendance.latitud,
          longitud: attendance.longitud
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
      const { attendanceId, lat, lng } = req.body;
      
      if (!attendanceId) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Se requiere attendanceId' 
        });
      }

      // Actualizar registro de asistencia
      const attendance = await prisma.Attendance.update({
        where: { id: parseInt(attendanceId) },
        data: {
          checkOut: new Date(),
          ...(lat && lng ? { 
            latitud: parseFloat(lat), 
            longitud: parseFloat(lng) 
          } : {})
        }
      });
      
      res.json({
        status: 'success',
        message: 'Check-out registrado correctamente',
        data: {
          id: attendance.id,
          userId: attendance.userId,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          latitud: attendance.latitud,
          longitud: attendance.longitud
        }
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
          message: 'Se requiere userId' 
        });
      }

      // Obtener registros de asistencia
      const attendances = await prisma.Attendance.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { checkIn: 'desc' }
      });

      // Transformar los datos para la respuesta
      const formattedAttendances = attendances.map(attendance => ({
        id: attendance.id,
        userId: attendance.userId,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        latitud: attendance.latitud,
        longitud: attendance.longitud
      }));
      
      res.json({
        status: 'success',
        data: formattedAttendances
      });
    } catch (error) {
      console.error('Error al obtener registros de asistencia:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Error al obtener registros de asistencia' 
      });
    }
  },

  /**
   * Obtiene los usuarios cercanos a una ubicación
   */
  async getUsersNearby(req, res) {
    try {
      const { lat, lng, radius = 1000 } = req.query; // Radio en metros, por defecto 1km
      
      if (!lat || !lng) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Se requiere lat y lng' 
        });
      }

      // Obtener todos los registros de asistencia activos (sin check-out)
      const activeAttendances = await prisma.Attendance.findMany({
        where: {
          checkOut: null,
          latitud: { not: null },
          longitud: { not: null }
        },
        include: {
          user: true
        }
      });

      // Filtrar los usuarios que están dentro del radio
      const nearbyUsers = activeAttendances.filter(attendance => 
        isPointWithinRadius(
          parseFloat(lat), 
          parseFloat(lng), 
          attendance.latitud, 
          attendance.longitud, 
          parseFloat(radius)
        )
      ).map(attendance => ({
        id: attendance.user.id,
        username: attendance.user.username,
        email: attendance.user.email,
        distance: calculateDistance(
          parseFloat(lat), 
          parseFloat(lng), 
          attendance.latitud, 
          attendance.longitud
        ),
        latitud: attendance.latitud,
        longitud: attendance.longitud,
        checkIn: attendance.checkIn
      }));
      
      // Ordenar por distancia
      nearbyUsers.sort((a, b) => a.distance - b.distance);
      
      res.json({
        status: 'success',
        data: nearbyUsers
      });
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