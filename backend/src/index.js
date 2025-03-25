require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Add BigInt serialization support
BigInt.prototype.toJSON = function() {
    return Number(this);
};

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
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desarrollo',
            },
        ],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rutas
app.use('/api/dashboard', dashboardRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
