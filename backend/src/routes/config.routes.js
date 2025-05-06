const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');

// Obtener la configuración de Supabase Storage para el cliente
router.get('/storage-config', configController.getStorageConfig);

module.exports = router; 