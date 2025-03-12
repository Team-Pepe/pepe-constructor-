const express = require('express');
const geoController = require('../controllers/geoController');
const router = express.Router();

/**
 * @swagger
 * /api/geo/check-in:
 *   post:
 *     summary: Registra la ubicación de un usuario (check-in)
 *     tags: [Geolocalización]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - lat
 *               - lng
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID del usuario
 *               lat:
 *                 type: number
 *                 format: float
 *                 description: Latitud
 *               lng:
 *                 type: number
 *                 format: float
 *                 description: Longitud
 *     responses:
 *       200:
 *         description: Check-in registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     checkIn:
 *                       type: string
 *                       format: date-time
 *                     location:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/check-in', geoController.checkIn);

/**
 * @swagger
 * /api/geo/check-out/{attendanceId}:
 *   put:
 *     summary: Registra la salida de un usuario (check-out)
 *     tags: [Geolocalización]
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del registro de asistencia
 *     responses:
 *       200:
 *         description: Check-out registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/check-out/:attendanceId', geoController.checkOut);

/**
 * @swagger
 * /api/geo/attendance/{userId}:
 *   get:
 *     summary: Obtiene los registros de asistencia de un usuario
 *     tags: [Geolocalización]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de registros de asistencia
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/attendance/:userId', geoController.getUserAttendance);

/**
 * @swagger
 * /api/geo/nearby:
 *   get:
 *     summary: Obtiene los usuarios cercanos a una ubicación
 *     tags: [Geolocalización]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: float
 *         required: true
 *         description: Latitud
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           format: float
 *         required: true
 *         description: Longitud
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           format: float
 *         required: false
 *         description: Radio en metros (por defecto 1000)
 *     responses:
 *       200:
 *         description: Lista de usuarios cercanos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   user_id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   username:
 *                     type: string
 *                   check_in:
 *                     type: string
 *                     format: date-time
 *                   check_out:
 *                     type: string
 *                     format: date-time
 *                   location_text:
 *                     type: string
 *                   distance:
 *                     type: number
 *                     description: Distancia en metros
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/nearby', geoController.getUsersNearby);

module.exports = router; 