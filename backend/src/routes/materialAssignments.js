const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/material-assignments:
 *   post:
 *     summary: Asigna materiales a una zona de trabajo
 *     tags: [Asignaciones de Materiales]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_zona
 *               - id_material
 *               - cantidad_asignada
 *             properties:
 *               id_zona:
 *                 type: integer
 *                 description: ID de la zona de trabajo
 *               id_material:
 *                 type: integer
 *                 description: ID del material a asignar
 *               cantidad_asignada:
 *                 type: integer
 *                 description: Cantidad del material a asignar
 *     responses:
 *       201:
 *         description: Material asignado exitosamente
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
 *                   example: Material asignado correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     id_zona:
 *                       type: integer
 *                     id_material:
 *                       type: integer
 *                     cantidad_asignada:
 *                       type: integer
 *       400:
 *         description: Datos inválidos o stock insuficiente
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
router.post('/', async (req, res) => {
  try {
    console.log('Datos recibidos en materialAssignments:', req.body);
    const { id_zona, id_material, cantidad_asignada } = req.body;

    // Validar datos requeridos
    if (!id_zona || !id_material || !cantidad_asignada) {
      console.log('Datos faltantes:', { id_zona, id_material, cantidad_asignada });
      return res.status(400).json({
        status: 'error',
        message: 'Se requieren id_zona, id_material y cantidad_asignada'
      });
    }

    // Verificar que la zona existe
    const zona = await prisma.WorkZone.findUnique({
      where: { id: parseInt(id_zona) }
    });

    if (!zona) {
      return res.status(404).json({
        status: 'error',
        message: 'Zona de trabajo no encontrada'
      });
    }

    // Verificar que el material existe y tiene stock suficiente
    const material = await prisma.Material.findUnique({
      where: { id: parseInt(id_material) }
    });

    if (!material) {
      return res.status(404).json({
        status: 'error',
        message: 'Material no encontrado'
      });
    }

    if (material.quantity < parseInt(cantidad_asignada)) {
      return res.status(400).json({
        status: 'error',
        message: 'Stock insuficiente del material'
      });
    }

    // Verificar si ya existe una asignación para esta zona y material
    const existingAssignment = await prisma.ZonaMaterial.findFirst({
      where: {
        id_zona: parseInt(id_zona),
        id_material: parseInt(id_material)
      }
    });

    // Iniciar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar o crear la asignación
      let zonaMaterial;
      if (existingAssignment) {
        // Actualizar asignación existente
        zonaMaterial = await tx.ZonaMaterial.update({
          where: { id: existingAssignment.id },
          data: {
            cantidad_asignada: existingAssignment.cantidad_asignada + parseInt(cantidad_asignada)
          }
        });
      } else {
        // Crear nueva asignación
        zonaMaterial = await tx.ZonaMaterial.create({
          data: {
            id_zona: parseInt(id_zona),
            id_material: parseInt(id_material),
            cantidad_asignada: parseInt(cantidad_asignada)
          }
        });
      }

      // Descontar del inventario general
      await tx.Material.update({
        where: { id: parseInt(id_material) },
        data: {
          quantity: material.quantity - parseInt(cantidad_asignada)
        }
      });

      return zonaMaterial;
    });

    res.status(201).json({
      status: 'success',
      message: 'Material asignado correctamente',
      data: result
    });
  } catch (error) {
    console.error('Error al asignar material:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al asignar material',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/material-assignments/zona/{id_zona}:
 *   get:
 *     summary: Obtiene los materiales asignados a una zona
 *     tags: [Asignaciones de Materiales]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id_zona
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la zona de trabajo
 *     responses:
 *       200:
 *         description: Lista de materiales asignados a la zona
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
 *                       id_zona:
 *                         type: integer
 *                       id_material:
 *                         type: integer
 *                       cantidad_asignada:
 *                         type: integer
 *                       material:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *       404:
 *         description: Zona no encontrada
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
router.get('/zona/:id_zona', async (req, res) => {
  try {
    const { id_zona } = req.params;

    // Verificar que la zona existe
    const zona = await prisma.WorkZone.findUnique({
      where: { id: parseInt(id_zona) }
    });

    if (!zona) {
      return res.status(404).json({
        status: 'error',
        message: 'Zona de trabajo no encontrada'
      });
    }

    // Obtener materiales asignados a la zona
    const materialesAsignados = await prisma.ZonaMaterial.findMany({
      where: { id_zona: parseInt(id_zona) },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            description: true,
            quantity: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: materialesAsignados
    });
  } catch (error) {
    console.error('Error al obtener materiales asignados:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener materiales asignados',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/material-assignments/uso:
 *   post:
 *     summary: Registra el uso de materiales en una zona
 *     tags: [Asignaciones de Materiales]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_zona
 *               - id_material
 *               - cantidad_utilizada
 *             properties:
 *               id_zona:
 *                 type: integer
 *                 description: ID de la zona de trabajo
 *               id_material:
 *                 type: integer
 *                 description: ID del material utilizado
 *               cantidad_utilizada:
 *                 type: integer
 *                 description: Cantidad del material utilizada
 *     responses:
 *       200:
 *         description: Uso de material registrado exitosamente
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
 *                   example: Uso de material registrado correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     id_zona:
 *                       type: integer
 *                     id_material:
 *                       type: integer
 *                     cantidad_asignada:
 *                       type: integer
 *       400:
 *         description: Datos inválidos o cantidad insuficiente
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
router.post('/uso', async (req, res) => {
  try {
    const { id_zona, id_material, cantidad_utilizada } = req.body;

    // Validar datos requeridos
    if (!id_zona || !id_material || !cantidad_utilizada) {
      return res.status(400).json({
        status: 'error',
        message: 'Se requieren id_zona, id_material y cantidad_utilizada'
      });
    }

    // Verificar que la zona existe
    const zona = await prisma.WorkZone.findUnique({
      where: { id: parseInt(id_zona) }
    });

    if (!zona) {
      return res.status(404).json({
        status: 'error',
        message: 'Zona de trabajo no encontrada'
      });
    }

    // Verificar que el material existe
    const material = await prisma.Material.findUnique({
      where: { id: parseInt(id_material) }
    });

    if (!material) {
      return res.status(404).json({
        status: 'error',
        message: 'Material no encontrado'
      });
    }

    // Verificar si existe una asignación para esta zona y material
    const asignacion = await prisma.ZonaMaterial.findFirst({
      where: {
        id_zona: parseInt(id_zona),
        id_material: parseInt(id_material)
      }
    });

    if (!asignacion) {
      return res.status(404).json({
        status: 'error',
        message: 'No hay material asignado a esta zona'
      });
    }

    // Verificar que hay suficiente cantidad asignada
    if (asignacion.cantidad_asignada < parseInt(cantidad_utilizada)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cantidad insuficiente del material en la zona'
      });
    }

    // Actualizar la cantidad asignada
    const updatedAsignacion = await prisma.ZonaMaterial.update({
      where: { id: asignacion.id },
      data: {
        cantidad_asignada: asignacion.cantidad_asignada - parseInt(cantidad_utilizada)
      }
    });

    res.json({
      status: 'success',
      message: 'Uso de material registrado correctamente',
      data: updatedAsignacion
    });
  } catch (error) {
    console.error('Error al registrar uso de material:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al registrar uso de material',
      error: error.message
    });
  }
});

module.exports = router;