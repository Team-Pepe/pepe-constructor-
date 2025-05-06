const { prisma } = require('../config/db');

// Crear una nueva zona de trabajo
exports.createWorkZone = async (req, res) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const { name, description, supervisorId, latitude, longitude } = req.body;
    
    // Validar datos requeridos
    if (!name || !supervisorId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Se requieren nombre y supervisor para crear una zona de trabajo' 
      });
    }
    
    // Crear zona de trabajo en la base de datos
    const newWorkZone = await prisma.WorkZone.create({
      data: {
        name,
        description,
        supervisor: {
          connect: { id: parseInt(supervisorId) }
        },
        latitud: parseFloat(latitude),
        longitud: parseFloat(longitude),
      }
    });

    res.status(201).json({ 
      status: 'success', 
      newWorkZone 
    });
  } catch (error) {
    console.error('Error al crear zona de trabajo:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al crear zona de trabajo',
      error: error.message 
    });
  }
};

// Obtener todas las zonas de trabajo
exports.getAllWorkZones = async (req, res) => {
  try {
    const workZones = await prisma.WorkZone.findMany({
      include: {
        supervisor: true, // Incluir el supervisor si es necesario
      }
    });
    res.json(workZones);
  } catch (error) {
    console.error('Error al obtener zonas de trabajo:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener zonas de trabajo' 
    });
  }
};

// Eliminar una zona de trabajo por su ID
exports.deleteWorkZone = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la zona de trabajo existe
    const workZone = await prisma.WorkZone.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!workZone) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Zona de trabajo no encontrada' 
      });
    }
    
    // Eliminar la zona de trabajo
    await prisma.WorkZone.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ 
      status: 'success', 
      message: 'Zona de trabajo eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar zona de trabajo:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al eliminar zona de trabajo',
      error: error.message
    });
  }
}; 