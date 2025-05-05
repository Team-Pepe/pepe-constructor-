const { prisma } = require('../config/db');

// Obtener todas las métricas
exports.getAllMetrics = async (req, res) => {
  try {
    const metrics = await prisma.Metric.findMany({
      include: {
        workZone: true,
      }
    });
    res.json(metrics);
  } catch (error) {
    console.error('Error al obtener métricas:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener métricas' });
  }
}; 