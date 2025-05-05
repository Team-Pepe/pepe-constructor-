const express = require('express');
const router = express.Router();
const taskController = require('../controllers/tasks.controller');

// Obtener todas las tareas
router.get('/', taskController.getAllTasks);

module.exports = router; 