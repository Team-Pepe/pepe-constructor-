const { prisma } = require('../config/db');

// Servicios reutilizables para usuarios

/**
 * Actualiza la ubicación de un usuario
 */
exports.updateUserLocation = async (userId, latitude, longitude) => {
  return await prisma.User.update({
    where: { id: parseInt(userId) },
    data: {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    }
  });
};

/**
 * Obtiene usuarios con filtro opcional por rol
 */
exports.getUsers = async (roleId = null) => {
  const filter = roleId ? { roleId: parseInt(roleId) } : {};
  
  return await prisma.User.findMany({
    where: filter,
    select: {
      id: true,
      email: true,
      username: true,
      roleId: true,
      job: {         // Include job relation
        select: {
          id: true,
          name: true
        }
      },
      latitude: true,
      longitude: true,
      bloodType: true,
      job: {         // Include job relation 
        select: { 
          id: true, 
          name: true 
        } 
      }
    }
  });
};