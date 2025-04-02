const express = require('express');
const { prisma } = require('../config/db');
const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', async (req, res) => {
  try {
    const { roleId } = req.query;
    const users = await prisma.User.findMany({
      where: roleId ? { roleId: Number(roleId) } : {},
    });
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener usuarios' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtiene un usuario por su ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Detalles del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
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
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.User.findUnique({
      where: { id: parseInt(id) },
      include: {
        attendances: true,
        requests: true,
        supervisedZones: true,
        assignedTasks: true,
      }
    });
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener usuario' });
  }
});

/**
 * @swagger
 * /api/work-zones:
 *   post:
 *     summary: Obtiene todas las zonas de trabajo
 *     tags: [Zonas de Trabajo]
 *     responses:
 *       200:
 *         description: Lista de zonas de trabajo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkZone'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/work-zones', async (req, res) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const { name, description, supervisorId, latitude, longitude } = req.body;
    
    // Validar datos requeridos
    if (!name || !supervisorId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Se requieren nombre y supervisor para crear una zona de trabajo' 
      });
    }    // Crear zona de trabajo en la base de datos
    const newWorkZone = await prisma.WorkZone.create({
      data: {
        name,
        description,
        supervisor: {
          connect: { id: parseInt(supervisorId) }
        },
        latitud: parseFloat(latitude), // Ahora directamente como float
        longitud: parseFloat(longitude), // Ahora directamente como float
        //radius: radius ? parseInt(radius) : 500 // Valor por defecto
      }
    });


    res.status(201).json({ 
      status: 'success', 
      data: newWorkZone 
    });
  } catch (error) {
    console.error('Error al crear zona de trabajo:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al crear zona de trabajo',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/work-zones:
 *   get:
 *     summary: Obtiene todas las zonas de trabajo
 *     tags: [Zonas de Trabajo]
 *     responses:
 *       200:
 *         description: Lista de zonas de trabajo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkZone'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/work-zones', async (req, res) => {
  try {
    const workZones = await prisma.WorkZone.findMany({
      include: {
        supervisor: true, // Incluir el supervisor si es necesario
      }
    });
    res.json(workZones);
  } catch (error) {
    console.error('Error al obtener zonas de trabajo:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener zonas de trabajo' 
    });
  }
});

/**
 * @swagger
 * /api/work-zones/{id}:
 *   delete:
 *     summary: Elimina una zona de trabajo por su ID
 *     tags: [Zonas de Trabajo]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la zona de trabajo a eliminar
 *     responses:
 *       200:
 *         description: Zona de trabajo eliminada correctamente
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
 *                   example: Zona de trabajo eliminada correctamente
 *       404:
 *         description: Zona de trabajo no encontrada
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
router.delete('/work-zones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la zona de trabajo existe
    const workZone = await prisma.WorkZone.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!workZone) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Zona de trabajo no encontrada' 
      });
    }
    
    // Eliminar la zona de trabajo
    await prisma.WorkZone.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ 
      status: 'success', 
      message: 'Zona de trabajo eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar zona de trabajo:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al eliminar zona de trabajo',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Obtiene todas las tareas
 *     tags: [Tareas]
 *     responses:
 *       200:
 *         description: Lista de tareas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.Task.findMany({
      include: {
        workZone: true,
        assignedTo: true,
      }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener tareas' });
  }
});

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: Obtiene todos los materiales
 *     tags: [Materiales]
 *     responses:
 *       200:
 *         description: Lista de materiales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Material'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/materials', async (req, res) => {
  try {
    const materials = await prisma.Material.findMany();
    res.json(materials);
  } catch (error) {
    console.error('Error al obtener materiales:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener materiales' });
  }
});

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Obtiene todas las solicitudes de materiales
 *     tags: [Solicitudes]
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Request'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/requests', async (req, res) => {
  try {
    const requests = await prisma.Request.findMany({
      include: {
        user: true,
        material: true,
      }
    });
    res.json(requests);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener solicitudes' });
  }
});

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Obtiene todas las métricas
 *     tags: [Métricas]
 *     responses:
 *       200:
 *         description: Lista de métricas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Metric'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await prisma.Metric.findMany({
      include: {
        workZone: true,
      }
    });
    res.json(metrics);
  } catch (error) {
    console.error('Error al obtener métricas:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener métricas' });
  }
});

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Obtiene todos los mensajes
 *     tags: [Mensajes]
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/messages', async (req, res) => {
  try {
    const messages = await prisma.Message.findMany({
      include: {
        sender: true,
        receiver: true,
      }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener mensajes' });
  }
});

/**
 * @swagger
 * /api/users/{id}/tasks:
 *   get:
 *     summary: Obtiene todas las tareas de un usuario
 *     tags: [Usuarios, Tareas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de tareas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const userTasks = await prisma.Task.findMany({
      where: {
        assignedToId: parseInt(id),
      },
      include: {
        workZone: true,
      },
      orderBy: {
        completionDate: 'desc',
      },
    });
    
    res.json(userTasks);
  } catch (error) {
    console.error('Error al obtener tareas del usuario:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener tareas del usuario' });
  }
});

module.exports = router; 