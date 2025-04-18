const express = require('express');
const { prisma } = require('../config/db');
const router = express.Router();
const { upload, processImage, deleteFile } = require('../utils/fileUtils');

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
 *       500:
 *         description: Error del servidor o error al subir a Supabase Storage
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('📝 Datos recibidos:', {
      name: req.body.name,
      description: req.body.description,
      quantity: req.body.quantity,
      image_url: req.image_url
      
    });
    console.log("crudos", req.body);

    const { name, description, quantity } = req.body;
    
    // Validar datos requeridos
    if (!name || quantity === undefined) {
      console.log('❌ Faltan datos requeridos');
      return res.status(400).json({ 
        status: 'error', 
        message: 'Se requieren nombre y cantidad para crear un material' 
      });
    }

    console.log('💾 Guardando material en la base de datos...');
    const newMaterial = await prisma.Material.create({
      data: {
        name,
        description,
        quantity: parseInt(quantity),
        image_url: req.body.image_url
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
 */
router.get('/', async (req, res) => {
  try {
    const materials = await prisma.Material.findMany();
    console.log("materiales a devolver++++++++++", materials);
    
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
 *       404:
 *         description: Material no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', async (req, res) => {
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
 * /api/materials/{id}:
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
 *       404:
 *         description: Material no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', async (req, res) => {
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

module.exports = router;