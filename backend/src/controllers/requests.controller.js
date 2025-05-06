const { prisma } = require('../config/db');

// Obtener todas las solicitudes
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Construir filtro según parámetros
    const filter = {};
    if (status) {
      filter.status = status;
    }
    
    const requests = await prisma.MaterialRequest.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    res.json({
      status: 'success',
      data: requests
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener solicitudes' });
  }
};

// Crear una nueva solicitud de material
exports.createRequest = async (req, res) => {
  try {
    console.log('Datos recibidos para solicitud:', req.body);
    const { zoneId, quantityRequested, message, userId, material, status = 'pending' } = req.body;

    // Validar datos requeridos
    if (!zoneId || !quantityRequested || !userId || !material) {
      return res.status(400).json({
        status: 'error',
        message: 'Se requieren zoneId, quantityRequested, userId y material'
      });
    }

    // Verificar que la zona existe
    const zona = await prisma.WorkZone.findUnique({
      where: { id: parseInt(zoneId) }
    });

    if (!zona) {
      return res.status(404).json({
        status: 'error',
        message: 'Zona de trabajo no encontrada'
      });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.User.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
    }

    // Crear la solicitud
    const newRequest = await prisma.Request.create({
      data: {
        zoneId: parseInt(zoneId),
        quantityRequested: parseFloat(quantityRequested),
        message,
        status,
        userId: parseInt(userId),
        material
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Solicitud creada correctamente',
      data: newRequest
    });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al crear solicitud',
      error: error.message
    });
  }
}; 