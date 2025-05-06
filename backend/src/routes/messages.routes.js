const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messages.controller');

// Obtener todos los mensajes
router.get('/', messageController.getAllMessages);

module.exports = router; 