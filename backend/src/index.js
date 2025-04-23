require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const authRouter = require('./routes/authRouter');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');
const dashboardEmpleadosRoutes = require('./routes/dashboardEmpleados');
const materialAssignmentsRoutes = require('./routes/materialAssignments');
const { authenticateToken, verifyCSRF } = require('./middleware/authMiddleware');
const { testEmailConnection } = require('./services/emailService');

// Requerir las utilidades de archivos para crear los directorios necesarios al inicio
require('./utils/fileUtils');

const app = express();
const prisma = new PrismaClient();

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Pepe Constructor',
      version: '1.0.0',
      description: 'Documentación de la API para el sistema de gestión de construcción',
    },
    servers: [{ url: process.env.API_ENDPOINT || 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'Autenticación basada en cookies JWT'
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'Token CSRF para protección contra solicitudes cruzadas'
        }
      }
    },
    security: [
      { cookieAuth: [], csrfToken: [] }
    ]
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares esenciales
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Actualizar configuración CORS para incluir headers CSRF
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token', 
    'Cookie',
    'X-Requested-With' // Añadir este header requerido
  ]
}));

// Añadir middleware CSRF antes de las rutas protegidas
app.use((req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'X-CSRF-Token');
  next();
});

// Conexión a la base de datos
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return false;
  }
}

// Probar conexión email al iniciar
testEmailConnection().then(isConnected => {
  if (!isConnected) {
    console.error('❌ Error: No se pudo establecer conexión con el servidor de correo');
  }
});

// Rutas públicas
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de autenticación
app.use('/api/auth', authRouter);

// Rutas protegidas
app.use('/api/dashboard', authenticateToken, verifyCSRF, dashboardRoutes);
app.use('/api/dashboard-empleados', authenticateToken, verifyCSRF, dashboardEmpleadosRoutes);
app.use('/api/material-assignments', authenticateToken, verifyCSRF, materialAssignmentsRoutes);
app.use('/api', authenticateToken, verifyCSRF, apiRoutes);

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err.stack);
  res.status(500).json({ 
    message: 'Algo salió mal!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
async function startServer() {
  const isConnected = await testDatabaseConnection();
  if (isConnected) {
    app.listen(PORT, () => {
      console.log(`\n✅ Servidor corriendo en ${process.env.API_ENDPOINT || `http://localhost:${PORT}`}`);
      console.log(`📚 Documentación disponible en ${process.env.API_ENDPOINT || `http://localhost:${PORT}`}/api-docs\n`);
      console.log('🔒 Middlewares de seguridad activados:');
      console.log('   - Helmet (Protección HTTP headers)');
      console.log('   - CORS (Orígenes permitidos)');
      console.log('   - JWT (Autenticación)');
      console.log('   - CSRF (Protección contra solicitudes cruzadas)\n');
    });
  } else {
    process.exit(1);
  }
}

startServer().catch(error => {
  console.error('❌ Error fatal al iniciar el servidor:', error);
  process.exit(1);
});
