const { prisma } = require('../config/db');

// Obtener todos los mensajes
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await prisma.Message.findMany({
      include: {
        sender: true,
        receiver: true,
      }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener mensajes' });
  }
}; 