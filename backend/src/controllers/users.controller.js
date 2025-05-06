const { prisma } = require('../config/db');
const userService = require('../services/userService');

// Actualizar ubicación de un usuario
exports.updateLocation = async (req, res) => {
  try {
    const { id, latitude, longitude } = req.body;
    
    // Validación básica de los datos requeridos
    if (!id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Se requiere id, latitude y longitude' 
      });
    }

    // Convertir valores a números
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Verificar que sean números válidos
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        status: 'error',
        message: 'La latitud y longitud deben ser números válidos'
      });
    }

    // Actualizar ubicación mediante el servicio
    const updatedUser = await userService.updateUserLocation(id, lat, lng);

    // Respuesta exitosa
    res.json({
      status: 'success',
      message: 'Ubicación actualizada correctamente',
      data: {
        userId: updatedUser.id,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude
      }
    });

  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar ubicación del usuario'
    });
  }
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const { roleId } = req.query;
    
    // Convertir roleId a número o validar
    let roleIdValue = undefined;
    if (roleId) {
      roleIdValue = Number(roleId);
      // Comprobar si roleId es un número válido
      if (isNaN(roleIdValue)) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'El roleId debe ser un número válido' 
        });
      }
    }
    
    console.log(`Buscando usuarios con roleId: ${roleIdValue}`);
    
    // Usar el servicio para obtener usuarios
    const users = await userService.getUsers(roleIdValue);
    
    console.log(`Encontrados ${users.length} usuarios`);
    
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    console.error('Detalles del error:', error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener usuarios',
      error: error.message 
    });
  }
};

// Obtener un usuario por su ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.User.findUnique({
      where: { id: parseInt(id) },
      include: {
        attendances: true,
        materialRequests: true,
        supervisedZones: true,
        assignedTasks: true,
      }
    });
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener usuario' });
  }
};

// Actualizar un usuario existente
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, bloodType, roleId } = req.body;

    // Verificar si existe otro usuario con el mismo email (excepto el actual)
    if (email) {
      const existingUser = await prisma.User.findFirst({
        where: {
          AND: [
            { email: email },
            { id: { not: parseInt(id) } }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Ya existe un usuario con este correo'
        });
      }
    }

    // Crear objeto con los campos a actualizar
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (bloodType !== undefined) updateData.bloodType = bloodType;
    if (roleId !== undefined) updateData.roleId = parseInt(roleId);

    // Asegurarnos de que haya al menos un campo para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No se proporcionaron datos para actualizar'
      });
    }

    // Actualizar usuario
    const updatedUser = await prisma.User.update({
      where: {
        id: parseInt(id)
      },
      data: updateData
    });

    res.json({
      status: 'success',
      message: 'Usuario actualizado correctamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Obtener todas las tareas de un usuario
exports.getUserTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const userTasks = await prisma.Task.findMany({
      where: {
        assignedToId: parseInt(id),
      },
      include: {
        workZone: true,
      },
      orderBy: {
        completionDate: 'desc',
      },
    });
    
    res.json(userTasks);
  } catch (error) {
    console.error('Error al obtener tareas del usuario:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener tareas del usuario' });
  }
};

// Añade esta función al final del archivo

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID sea un número válido
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'El ID del usuario debe ser un número válido' 
      });
    }
    
    // Verificar si el usuario existe
    const user = await prisma.User.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Eliminar el usuario
    await prisma.User.delete({
      where: { id: userId }
    });
    
    res.json({
      status: 'success',
      message: 'Usuario eliminado correctamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      return res.status(400).json({
        status: 'error',
        message: 'No se puede eliminar el usuario porque tiene registros relacionados'
      });
    }
    
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al eliminar el usuario' 
    });
  }
};