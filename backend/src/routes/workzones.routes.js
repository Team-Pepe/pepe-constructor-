const express = require('express');
const router = express.Router();
const workZoneController = require('../controllers/workzones.controller');

// Crear una nueva zona de trabajo
router.post('/', workZoneController.createWorkZone);

// Obtener todas las zonas de trabajo
router.get('/', workZoneController.getAllWorkZones);

// Eliminar una zona de trabajo por su ID
router.delete('/:id', workZoneController.deleteWorkZone);

module.exports = router; 