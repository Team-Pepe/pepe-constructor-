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
    
    // Obtener solicitudes sin incluir user
    const requests = await prisma.MaterialRequest.findMany({
      where: filter,
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Obtener usuarios relacionados
    const userIds = [...new Set(requests.map(req => req.user_id).filter(Boolean))];
    const users = userIds.length > 0 ? await prisma.User.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        username: true
      }
    }) : [];
    
    // Crear mapa de usuarios para búsqueda rápida
    const userMap = new Map(users.map(user => [user.id, user]));

    // Convertir BigInt a string y agregar información de usuario
    const safeRequests = requests.map(request => {
      const userData = request.user_id ? userMap.get(request.user_id) : null;
      
      return {
        id: request.id?.toString(),
        user_id: request.user_id?.toString() || null,
        zone_id: request.zone_id?.toString() || null,
        message: request.message,
        quantity_requested: request.quantity_requested,
        material: request.material,
        status: request.status,
        created_at: request.created_at,
        user: userData ? {
          id: userData.id?.toString(),
          email: userData.email,
          username: userData.username
        } : null
      };
    });
    
    res.json({
      status: 'success',
      data: safeRequests
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