const express = require('express');
const { prisma } = require('../config/db');
const router = express.Router();
const path = require('path');
const { upload, processImage, deleteFile } = require('../utils/fileUtils');

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
 * components:
 *   schemas:
 *     Material:
 *       type: object
 *       required:
 *         - name
 *         - quantity
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del material
 *         name:
 *           type: string
 *           description: Nombre del material
 *         description:
 *           type: string
 *           description: Descripción del material
 *         quantity:
 *           type: integer
 *           description: Cantidad disponible en inventario
 *         image_url:
 *           type: string
 *           description: URL de la imagen del material en Supabase Storage
 *       example:
 *         id: 1
 *         name: "Cemento"
 *         description: "Cemento Portland de alta resistencia"
 *         quantity: 50
 *         image_url: "https://deveoqcczffdpsjopgwg.supabase.co/storage/v1/object/public/images/materials/123e4567-e89b-12d3-a456-426614174000-cemento.jpg"
 */

/**
 * @swagger
 * /api/materials:
 *   post:
 *     summary: Crea un nuevo material con imagen en Supabase Storage
 *     tags: [Materiales]
 *     description: Crea un nuevo material en la base de datos y sube la imagen a Supabase Storage
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del material
 *               description:
 *                 type: string
 *                 description: Descripción del material
 *               quantity:
 *                 type: integer
 *                 description: Cantidad disponible
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del material (soporta jpg, jpeg, png, gif)
 *     responses:
 *       201:
 *         description: Material creado exitosamente con imagen subida a Supabase Storage
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *       400:
 *         description: Datos inválidos o archivo de imagen no válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Se requieren nombre y cantidad para crear un material
 *       500:
 *         description: Error del servidor o error al subir a Supabase Storage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                 stack:
 *                   type: string
 */
router.post('/materials', upload.single('image'), async (req, res) => {
  try {
    console.log('📝 Datos recibidos:', {
      name: req.body.name,
      description: req.body.description,
      quantity: req.body.quantity,
      file: req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file'
    });

    const { name, description, quantity } = req.body;
    
    // Validar datos requeridos
    if (!name || quantity === undefined) {
      console.log('❌ Faltan datos requeridos');
      return res.status(400).json({ 
        status: 'error', 
        message: 'Se requieren nombre y cantidad para crear un material' 
      });
    }

    // Procesar la imagen y subirla a Supabase si existe
    let imageUrl = null;
    if (req.file) {
      try {
        console.log('🖼️ Procesando imagen y subiendo a Supabase...');
        const processResult = await processImage(req.file, 'materials');
        
        if (processResult.success) {
          imageUrl = processResult.url;
          console.log('✅ Imagen subida a Supabase:', imageUrl);
        } else {
          console.error('❌ Error al procesar imagen:', processResult.message);
        }
      } catch (error) {
        console.error('❌ Error al procesar la imagen:', error);
        // Continuar sin imagen si falla el procesamiento
      }
    } else {
      console.log('⚠️ No se recibió imagen');
    }

    console.log('💾 Guardando material en la base de datos...');
    const newMaterial = await prisma.Material.create({
      data: {
        name,
        description,
        quantity: parseInt(quantity),
        image_url: imageUrl
      }
    });

    console.log('✅ Material creado:', newMaterial);
    res.status(201).json(newMaterial);
  } catch (error) {
    console.error('❌ Error al crear material:', error);
    console.error('Stack trace completo:', error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al crear material',
      error: error.message,
      stack: error.stack
    });
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
 * /api/materials/{id}:
 *   delete:
 *     summary: Elimina un material por su ID y su imagen de Supabase Storage
 *     tags: [Materiales]
 *     description: Elimina un material de la base de datos y también elimina su imagen asociada de Supabase Storage
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del material a eliminar
 *     responses:
 *       200:
 *         description: Material e imagen eliminados exitosamente
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
 *                   example: Material eliminado correctamente
 *       404:
 *         description: Material no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Material no encontrado
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.delete('/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el material existe
    const material = await prisma.Material.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!material) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Material no encontrado' 
      });
    }
    
    // Eliminar la imagen asociada de Supabase si existe
    if (material.image_url) {
      try {
        const deleted = await deleteFile(material.image_url);
        if (deleted) {
          console.log(`✅ Imagen eliminada de Supabase: ${material.image_url}`);
        } else {
          console.log(`⚠️ No se pudo eliminar la imagen de Supabase: ${material.image_url}`);
        }
      } catch (error) {
        console.error('❌ Error al eliminar imagen de Supabase:', error);
        // Continuar con la eliminación del material incluso si falla la eliminación de la imagen
      }
    }
    
    // Eliminar el material
    await prisma.Material.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ 
      status: 'success', 
      message: 'Material eliminado correctamente' 
    });
  } catch (error) {
    console.error('❌ Error al eliminar material:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al eliminar material',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/materials/update/{id}:
 *   put:
 *     summary: Actualiza un material existente
 *     tags: [Materiales]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del material a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del material
 *               description:
 *                 type: string
 *                 description: Descripción del material
 *               quantity:
 *                 type: integer
 *                 description: Cantidad disponible
 *               image_url:
 *                 type: string
 *                 description: URL de la imagen del material
 *     responses:
 *       200:
 *         description: Material actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *       404:
 *         description: Material no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Material no encontrado
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.put('/api/materials/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, image_url } = req.body;
    
    console.log('📝 Actualizando material:', { id, name, description, quantity, image_url });
    
    // Verificar si el material existe
    const existingMaterial = await prisma.Material.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingMaterial) {
      console.log('❌ Material no encontrado:', id);
      return res.status(404).json({ 
        status: 'error', 
        message: 'Material no encontrado' 
      });
    }
    
    // Actualizar el material
    const updatedMaterial = await prisma.Material.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        quantity: parseInt(quantity),
        image_url
      }
    });
    
    console.log('✅ Material actualizado:', updatedMaterial);
    res.json(updatedMaterial);
  } catch (error) {
    console.error('❌ Error al actualizar material:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al actualizar material',
      error: error.message
    });
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

module.exports = router; 