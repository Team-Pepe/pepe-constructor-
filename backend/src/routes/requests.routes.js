const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requests.controller');

// Obtener todas las solicitudes
router.get('/', requestController.getAllRequests);

// Crear una nueva solicitud de material
router.post('/', requestController.createRequest);

module.exports = router; 