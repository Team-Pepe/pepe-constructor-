const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');

// Actualizar ubicación de un usuario
router.put('/location', userController.updateLocation);

// Obtener todos los usuarios
router.get('/', userController.getAllUsers);

// Obtener un usuario por su ID
router.get('/:id', userController.getUserById);

// Actualizar un usuario existente
router.put('/:id', userController.updateUser);

// Obtener todas las tareas de un usuario
router.get('/:id/tasks', userController.getUserTasks);

module.exports = router; 