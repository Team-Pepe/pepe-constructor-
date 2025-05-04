const express = require('express');
const { prisma } = require('../config/db');
const router = express.Router();


// Import materials routes
const materialsRouter = require('./materials');

// Register materials routes
router.use('/materials', materialsRouter);

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
    
    // Convertir roleId a número o validar
    let roleIdValue = undefined;
    if (roleId) {
      roleIdValue = Number(roleId);
      // Comprobar si roleId es un número válido
      if (isNaN(roleIdValue)) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'El roleId debe ser un número válido' 
        });
      }
    }
    
    console.log(`Buscando usuarios con roleId: ${roleIdValue}`);
    
    const users = await prisma.User.findMany({
      where: roleIdValue ? { roleId: roleIdValue } : {},
      select: {
        id: true,
        email: true,
        username: true,
        roleId: true,
        latitude: true,
        longitude: true,
        bloodType: true
      }
    });
    
    console.log(`Encontrados ${users.length} usuarios`);
    
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    console.error('Detalles del error:', error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener usuarios',
      error: error.message 
    });
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
        materialRequests: true,
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
 * /api/users/{id}:
 *   put:
 *     summary: Actualiza un usuario existente
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, bloodType, roleId } = req.body;

    // Verificar si existe otro usuario con el mismo email (excepto el actual)
    if (email) {
      const existingUser = await prisma.User.findFirst({
        where: {
          AND: [
            { email: email },
            { id: { not: parseInt(id) } }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Ya existe un usuario con este correo'
        });
      }
    }

    // Crear objeto con los campos a actualizar
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (bloodType !== undefined) updateData.bloodType = bloodType;
    if (roleId !== undefined) updateData.roleId = parseInt(roleId);

    // Asegurarnos de que haya al menos un campo para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No se proporcionaron datos para actualizar'
      });
    }

    // Actualizar usuario
    const updatedUser = await prisma.User.update({
      where: {
        id: parseInt(id)
      },
      data: updateData
    });

    res.json({
      status: 'success',
      message: 'Usuario actualizado correctamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/work-zones:
 *   post:
 *     summary: Crea una nueva zona de trabajo
 *     tags: [Zonas de Trabajo]
 *     security:
 *       - cookieAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - supervisorId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la zona de trabajo
 *               description:
 *                 type: string
 *                 description: Descripción de la zona de trabajo
 *               supervisorId:
 *                 type: integer
 *                 description: ID del supervisor de la zona
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Latitud de la ubicación de la zona
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Longitud de la ubicación de la zona
 *     responses:
 *       201:
 *         description: Zona de trabajo creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/WorkZone'
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
      newWorkZone 
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
 * /api/requests:
 *   get:
 *     summary: Obtiene todas las solicitudes
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
    const { status } = req.query;
    
    // Construir filtro según parámetros
    const filter = {};
    if (status) {
      filter.status = status;
    }
    
    const requests = await prisma.MaterialRequest.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    res.json({
      status: 'success',
      data: requests
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener solicitudes' });
  }
});

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Crea una nueva solicitud de material
 *     tags: [Solicitudes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - zoneId
 *               - quantityRequested
 *               - userId
 *               - material
 *             properties:
 *               zoneId:
 *                 type: integer
 *                 description: ID de la zona de trabajo
 *               quantityRequested:
 *                 type: number
 *                 format: float
 *                 description: Cantidad solicitada
 *               message:
 *                 type: string
 *                 description: Mensaje o nota adicional
 *               userId:
 *                 type: integer
 *                 description: ID del usuario que hace la solicitud
 *               material:
 *                 type: string
 *                 description: Nombre del material solicitado
 *               status:
 *                 type: string
 *                 description: Estado de la solicitud (por defecto 'pending')
 *     responses:
 *       201:
 *         description: Solicitud creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Request'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/requests', async (req, res) => {
  try {
    console.log('Datos recibidos para solicitud:', req.body);
    const { zoneId, quantityRequested, message, userId, material, status = 'pending' } = req.body;

    // Validar datos requeridos
    if (!zoneId || !quantityRequested || !userId || !material) {
      return res.status(400).json({
        status: 'error',
        message: 'Se requieren zoneId, quantityRequested, userId y material'
      });
    }

    // Verificar que la zona existe
    const zona = await prisma.WorkZone.findUnique({
      where: { id: parseInt(zoneId) }
    });

    if (!zona) {
      return res.status(404).json({
        status: 'error',
        message: 'Zona de trabajo no encontrada'
      });
    }

    // Verificar que el usuario existe
    const usuario = await prisma.User.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
    }

    // Crear la solicitud
    const newRequest = await prisma.Request.create({
      data: {
        zoneId: parseInt(zoneId),
        quantityRequested: parseFloat(quantityRequested),
        message,
        status,
        userId: parseInt(userId),
        material
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Solicitud creada correctamente',
      data: newRequest
    });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al crear solicitud',
      error: error.message
    });
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

/**
 * @swagger
 * /api/storage-config:
 *   get:
 *     summary: Obtiene la configuración de Supabase Storage para el cliente
 *     tags: [Configuración]
 *     responses:
 *       200:
 *         description: Configuración de Supabase Storage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projectId:
 *                   type: string
 *                   description: ID del proyecto de Supabase
 *                 bucket:
 *                   type: string
 *                   description: Nombre del bucket de almacenamiento
 *                 supabaseKey:
 *                   type: string
 *                   description: Clave anónima para operaciones de cliente
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/storage-config', (req, res) => {
  try {
    // Extraer el projectId de la URL de Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    let projectId = '';
    
    try {
      const url = new URL(supabaseUrl);
      // La estructura típica es: https://[projectId].supabase.co
      projectId = url.hostname.split('.')[0];
    } catch (error) {
      console.error('Error al parsear la URL de Supabase:', error);
    }
    
    // Nombre del bucket desde variable de entorno
    const bucket = process.env.SUPABASE_BUCKET;
    
    // Responder con la configuración
    res.json({
      projectId,
      bucket,
      supabaseKey: process.env.SUPABASE_KEY
    });
  } catch (error) {
    console.error('Error al obtener configuración de Supabase:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al obtener configuración de Supabase' 
    });
  }
});

/**
 * @swagger
 * /api/users/location:
 *   put:
 *     summary: Actualiza la ubicación de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *               - id
 *             properties:
 *               latitude:
 *                 type: number
 *                 description: Latitud de la ubicación
 *               longitude:
 *                 type: number
 *                 description: Longitud de la ubicación
 *               id:
 *                 type: integer
 *                 description: ID del usuario
 *     responses:
 *       200:
 *         description: Ubicación actualizada correctamente
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
 *                   example: Ubicación actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: ID del usuario no coincide con el token de autenticación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.put('/users/location', async (req, res) => {
  try {
    const { id, latitude, longitude } = req.body;
    
    // Validación básica de los datos requeridos
    if (!id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Se requiere id, latitude y longitude' 
      });
    }

    // Convertir valores a números
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Verificar que sean números válidos
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        status: 'error',
        message: 'La latitud y longitud deben ser números válidos'
      });
    }

    // Actualizar solo la ubicación
    const updatedUser = await prisma.User.update({
      where: { id: parseInt(id) },
      data: {
        latitude: lat,
        longitude: lng
      }
    });

    // Respuesta exitosa
    res.json({
      status: 'success',
      message: 'Ubicación actualizada correctamente',
      data: {
        userId: updatedUser.id,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude
      }
    });

  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al actualizar ubicación del usuario'
    });
  }
});

module.exports = router;