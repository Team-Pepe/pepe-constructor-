const express = require('express');
const { prisma, testConnection } = require('./config/db');
const apiRoutes = require('./routes/api');
const geoRoutes = require('./routes/geo');
const { setupSwagger } = require('./config/swagger');

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Configurar Swagger
setupSwagger(app);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Ruta de prueba
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Mensaje de bienvenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
app.get('/', (req, res) => {
  res.json({ message: 'API de Pepe Constructor funcionando correctamente' });
});

/**
 * @swagger
 * /test-db:
 *   get:
 *     summary: Prueba la conexión a la base de datos
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Conexión exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Error de conexión
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/test-db', async (req, res) => {
  const isConnected = await testConnection();
  if (isConnected) {
    res.json({ status: 'success', message: 'Conexión a la base de datos establecida correctamente' });
  } else {
    res.status(500).json({ status: 'error', message: 'Error al conectar con la base de datos' });
  }
});

// Usar las rutas de la API
app.use('/api', apiRoutes);

// Usar las rutas geoespaciales
app.use('/api/geo', geoRoutes);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtiene todos los usuarios (ruta directa)
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
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.User.findMany();
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ status: 'error', message: 'Error al obtener usuarios' });
  }
});

// Iniciar el servidor
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación de la API disponible en http://localhost:${PORT}/docs`);
  
  // Probar la conexión a la base de datos al iniciar
  await testConnection();
});

// Manejar el cierre de la aplicación
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Conexión a la base de datos cerrada');
  process.exit(0);
});
