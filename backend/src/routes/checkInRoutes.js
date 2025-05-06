const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const multer = require('multer');
const { upload } = require('../utils/fileUtils');
const { registerCheckIn, getRecentCheckIns } = require('../controllers/checkInController');

/**
 * @swagger
 * /api/check-in:
 *   post:
 *     summary: Registrar un nuevo check-in
 *     tags: [Check-ins]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               zoneId:
 *                 type: number
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Check-in registrado exitosamente
 */
router.post('/', authenticateToken, upload.single('photo'), registerCheckIn);

/**
 * @swagger
 * /api/check-ins/recent:
 *   get:
 *     summary: Obtener check-ins recientes del usuario
 *     tags: [Check-ins]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de check-ins a retornar
 *     responses:
 *       200:
 *         description: Lista de check-ins recientes
 */
router.get('/recent', authenticateToken, getRecentCheckIns);

module.exports = router;