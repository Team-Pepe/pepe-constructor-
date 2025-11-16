require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { testEmailConnection } = require('./services/emailService');
const authRouter = require('./routes/authRouter');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');
const dashboardEmpleadosRoutes = require('./routes/dashboardEmpleados');
const materialAssignmentsRoutes = require('./routes/materialAssignments');
const checkInRoutes = require('./routes/checkInRoutes');
const chatRoutes = require('./routes/chat');
const { authenticateToken, verifyCSRF } = require('./middlewares/authMiddleware');
const geoRoutes = require('./routes/geo');
const { setupSocketIO } = require('./controllers/socketController');

// Requerir las utilidades de archivos para crear los directorios necesarios al inicio
require('./utils/fileUtils');

const app = express();
const server = createServer(app);
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

const frontendUrl= process.env.FRONTEND_URL
// Actualizar configuración CORS para incluir headers CSRF y Socket.io
const allowedOrigins = [
  "http://localhost:5173",
  "https://pepe-constructor.vercel.app",
  "https://pepe-constructor-git-master-aiskiubs-projects.vercel.app",
  "https://pepe-constructor-ns7k8krfp-aiskiubs-projects.vercel.app"
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token', 
    'Cookie',
    'X-Requested-With'
  ]
}));

// Configurar Socket.io con CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configurar Socket.io
setupSocketIO(io);

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
app.use('/api/check-in', checkInRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/chat', authenticateToken, verifyCSRF, chatRoutes);
app.use('/api', authenticateToken, verifyCSRF, apiRoutes);
app.use('/api/geo', authenticateToken, geoRoutes);

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
    server.listen(PORT, () => {
      console.log(`\n✅ Servidor corriendo en ${process.env.API_ENDPOINT || `http://localhost:${PORT}`}`);
      console.log(`📚 Documentación disponible en ${process.env.API_ENDPOINT || `http://localhost:${PORT}`}/api-docs\n`);
      console.log('🔒 Middlewares de seguridad activados:');
      console.log('   - Helmet (Protección HTTP headers)');
      console.log('   - CORS (Orígenes permitidos)');
      console.log('   - JWT (Autenticación)');
      console.log('   - CSRF (Protección contra solicitudes cruzadas)');
      console.log('💬 Socket.io activado para chat en tiempo real\n');
    });
  } else {
    process.exit(1);
  }
}

startServer().catch(error => {
  console.error('❌ Error fatal al iniciar el servidor:', error);
  process.exit(1);
});
