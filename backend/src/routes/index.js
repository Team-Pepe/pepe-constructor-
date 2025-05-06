const express = require('express');
const router = express.Router();

// Import routes
const userRoutes = require('./users.routes');
const workZoneRoutes = require('./workzones.routes');
const taskRoutes = require('./tasks.routes');
const requestRoutes = require('./requests.routes');
const metricRoutes = require('./metrics.routes');
const messageRoutes = require('./messages.routes');
const configRoutes = require('./config.routes');
const materialsRoutes = require('./materials');

// Register routes
router.use('/users', userRoutes);
router.use('/work-zones', workZoneRoutes);
router.use('/tasks', taskRoutes);
router.use('/requests', requestRoutes);
router.use('/metrics', metricRoutes);
router.use('/messages', messageRoutes);
router.use('/materials', materialsRoutes);

// Config routes are directly under /api
router.use('/', configRoutes);

module.exports = router; 