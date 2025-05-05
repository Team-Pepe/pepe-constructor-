const { prisma } = require('../config/db');

// Obtener todas las tareas
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.Task.findMany({
      include: {
        workZone: true,
        assignedTo: true,
      }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener tareas' });
  }
}; 