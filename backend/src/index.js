require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');
const authRouter = require('./routes/authRouter'); // 👈 Correcto para CommonJS
const dashboardEmpleadosRoutes = require('./routes/dashboardEmpleados'); // 👈 Agregamos las rutas de dashboard empleados

// Requerir las utilidades de archivos para crear los directorios necesarios al inicio
require('./utils/fileUtils');

const app = express();
const prisma = new PrismaClient();

const cookieParser = require("cookie-parser");

const authenticateToken = require("./middleware/authMiddleware");

app.use(cookieParser());
// Configuración de CORS
app.use(cors({
    origin: "http://localhost:5173", // Reemplaza con la URL de tu frontend
    credentials: true, // Permitir el envío de cookies y credenciales
}));

// Middleware para parsear JSON y form data con límites razonables
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos desde la carpeta uploads
const uploadsPath = path.join(__dirname, '../uploads');
console.log('📁 Configurando directorio de uploads:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Rutas protegidas
app.use("/api/dashboard", authenticateToken, dashboardRoutes);
app.use("/api/dashboard-empleados", authenticateToken, dashboardEmpleadosRoutes); // 👈 Actualizamos la ruta protegida

// Verificar conexión a la base de datos
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

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Pepe Constructor',
            version: '1.0.0',
            description: 'Documentación de la API para el sistema de gestión de construcción',
            contact: {
                name: 'Equipo de Desarrollo',
                url: 'https://github.com/tu-usuario/pepe-constructor'
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desarrollo',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rutas
app.use('/api/auth', authRouter); // 👈 Agregamos las rutas de autenticación
app.use('/api/dashboard', dashboardRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', apiRoutes); 

// Ruta de prueba
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;

// Iniciar servidor solo si la conexión a la base de datos es exitosa
async function startServer() {
    const isConnected = await testDatabaseConnection();
    if (isConnected) {
        app.listen(PORT, () => {
            console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📚 Documentación disponible en http://localhost:${PORT}/api-docs`);
        });
    } else {
        console.error('❌ No se pudo iniciar el servidor debido a problemas con la base de datos');
        process.exit(1);
    }
}

startServer().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
