const express = require('express');
const router = express.Router();
const metricController = require('../controllers/metrics.controller');

// Obtener todas las métricas
router.get('/', metricController.getAllMetrics);

module.exports = router; 