const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

/**
 * @swagger
 * /api/chat/general:
 *   get:
 *     summary: Obtener mensajes del chat general
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de mensajes a obtener
 *     responses:
 *       200:
 *         description: Mensajes obtenidos exitosamente
 *       500:
 *         description: Error del servidor
 */
router.get('/general', chatController.getGeneralMessages);

/**
 * @swagger
 * /api/chat/zone/{zoneId}:
 *   get:
 *     summary: Obtener mensajes de una zona específica
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la zona de trabajo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de mensajes a obtener
 *     responses:
 *       200:
 *         description: Mensajes obtenidos exitosamente
 *       500:
 *         description: Error del servidor
 */
router.get('/zone/:zoneId', chatController.getZoneMessages);

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Enviar un mensaje
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workZoneId:
 *                 type: integer
 *                 description: ID de la zona (null para chat general)
 *               content:
 *                 type: string
 *                 description: Contenido del mensaje
 *             required:
 *               - content
 *     responses:
 *       200:
 *         description: Mensaje enviado exitosamente
 *       500:
 *         description: Error del servidor
 */
router.post('/send', chatController.sendMessageREST);

/**
 * @swagger
 * /api/chat/stats:
 *   get:
 *     summary: Obtener estadísticas del chat
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       500:
 *         description: Error del servidor
 */
router.get('/stats', chatController.getChatStats);

module.exports = router; 