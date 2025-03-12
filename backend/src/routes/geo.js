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
 *                     latitud:
 *                       type: number
 *                       format: float
 *                     longitud:
 *                       type: number
 *                       format: float
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/check-in', geoController.checkIn);

/**
 * @swagger
 * /api/geo/check-out:
 *   post:
 *     summary: Registra la salida de un usuario (check-out)
 *     tags: [Geolocalización]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendanceId
 *             properties:
 *               attendanceId:
 *                 type: integer
 *                 description: ID del registro de asistencia
 *               lat:
 *                 type: number
 *                 format: float
 *                 description: Latitud (opcional)
 *               lng:
 *                 type: number
 *                 format: float
 *                 description: Longitud (opcional)
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     checkIn:
 *                       type: string
 *                       format: date-time
 *                     checkOut:
 *                       type: string
 *                       format: date-time
 *                     latitud:
 *                       type: number
 *                       format: float
 *                     longitud:
 *                       type: number
 *                       format: float
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/check-out', geoController.checkOut);

/**
 * @swagger
 * /api/geo/user/{userId}/attendance:
 *   get:
 *     summary: Obtiene los registros de asistencia de un usuario
 *     tags: [Geolocalización]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de registros de asistencia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       checkIn:
 *                         type: string
 *                         format: date-time
 *                       checkOut:
 *                         type: string
 *                         format: date-time
 *                       latitud:
 *                         type: number
 *                         format: float
 *                       longitud:
 *                         type: number
 *                         format: float
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.get('/user/:userId/attendance', geoController.getUserAttendance);

/**
 * @swagger
 * /api/geo/users-nearby:
 *   get:
 *     summary: Obtiene los usuarios cercanos a una ubicación
 *     tags: [Geolocalización]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitud
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitud
 *       - in: query
 *         name: radius
 *         required: false
 *         schema:
 *           type: number
 *           format: float
 *           default: 1000
 *         description: Radio en metros (por defecto 1000m)
 *     responses:
 *       200:
 *         description: Lista de usuarios cercanos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       distance:
 *                         type: number
 *                         format: float
 *                         description: Distancia en metros
 *                       latitud:
 *                         type: number
 *                         format: float
 *                       longitud:
 *                         type: number
 *                         format: float
 *                       checkIn:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.get('/users-nearby', geoController.getUsersNearby);

module.exports = router; 