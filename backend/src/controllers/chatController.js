const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener mensajes del chat general
exports.getGeneralMessages = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const messages = await prisma.chatMessage.findMany({
      where: {
        workZoneId: null // Chat general
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            roleId: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Invertir el orden para mostrar más antiguos primero
    res.json({
      status: 'success',
      data: messages.reverse()
    });
  } catch (error) {
    console.error('Error al obtener mensajes generales:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener mensajes generales' 
    });
  }
};

// Obtener mensajes de una zona específica
exports.getZoneMessages = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { limit = 50 } = req.query;
    
    const messages = await prisma.chatMessage.findMany({
      where: {
        workZoneId: parseInt(zoneId)
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            roleId: true
          }
        },
        workZone: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: parseInt(limit)
    });

    // Invertir el orden para mostrar más antiguos primero
    res.json({
      status: 'success',
      data: messages.reverse()
    });
  } catch (error) {
    console.error('Error al obtener mensajes de zona:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener mensajes de zona' 
    });
  }
};

// Enviar mensaje (usado por Socket.io y REST)
exports.sendMessage = async (messageData) => {
  try {
    const { senderId, workZoneId, content } = messageData;

    // Validaciones básicas
    if (!senderId || !content || content.trim().length === 0) {
      throw new Error('Datos incompletos para enviar mensaje');
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: parseInt(senderId) },
      select: {
        id: true,
        username: true,
        roleId: true
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Si es un mensaje de zona, verificar que la zona existe
    let workZone = null;
    if (workZoneId) {
      workZone = await prisma.workZone.findUnique({
        where: { id: parseInt(workZoneId) },
        select: {
          id: true,
          name: true
        }
      });

      if (!workZone) {
        throw new Error('Zona de trabajo no encontrada');
      }
    }

    // Crear el mensaje
    const newMessage = await prisma.chatMessage.create({
      data: {
        senderId: parseInt(senderId),
        workZoneId: workZoneId ? parseInt(workZoneId) : null,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            roleId: true
          }
        },
        workZone: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      status: 'success',
      data: newMessage
    };
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    throw error;
  }
};

// Endpoint REST para enviar mensaje
exports.sendMessageREST = async (req, res) => {
  try {
    const { workZoneId, content } = req.body;
    const senderId = req.user.id; // Del middleware de autenticación

    const result = await exports.sendMessage({
      senderId,
      workZoneId,
      content
    });

    res.json(result);
  } catch (error) {
    console.error('Error en sendMessageREST:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Error al enviar mensaje' 
    });
  }
};

// Obtener estadísticas de chat (opcional)
exports.getChatStats = async (req, res) => {
  try {
    const totalMessages = await prisma.chatMessage.count();
    const generalMessages = await prisma.chatMessage.count({
      where: { workZoneId: null }
    });
    const zoneMessages = await prisma.chatMessage.count({
      where: { workZoneId: { not: null } }
    });

    res.json({
      status: 'success',
      data: {
        totalMessages,
        generalMessages,
        zoneMessages
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener estadísticas' 
    });
  }
}; 