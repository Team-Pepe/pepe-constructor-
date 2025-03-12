const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Opciones de configuración de Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Pepe Constructor',
      version: '1.0.0',
      description: 'API para la gestión de construcción',
      contact: {
        name: 'Equipo de Desarrollo',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
          },
        },
        WorkZone: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            supervisorId: { type: 'integer' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            workZoneId: { type: 'integer' },
            assignedToId: { type: 'integer' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['pendiente', 'en_progreso', 'completada'] },
            completionDate: { type: 'string', format: 'date-time' },
            evidenceUrl: { type: 'string' },
          },
        },
        Material: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            quantity: { type: 'integer' },
          },
        },
        Request: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            materialId: { type: 'integer' },
            requestDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pendiente', 'aprobada', 'rechazada'] },
          },
        },
        Metric: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            workZoneId: { type: 'integer' },
            metricType: { type: 'string' },
            value: { type: 'number' },
            recordedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            senderId: { type: 'integer' },
            receiverId: { type: 'integer' },
            message: { type: 'string' },
            sentAt: { type: 'string', format: 'date-time' },
          },
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            checkIn: { type: 'string', format: 'date-time' },
            checkOut: { type: 'string', format: 'date-time' },
            latitud: { type: 'number', format: 'float' },
            longitud: { type: 'number', format: 'float' },
          },
        },
        GeoPoint: {
          type: 'object',
          properties: {
            lat: { type: 'number', format: 'float' },
            lng: { type: 'number', format: 'float' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/index.js'], // Rutas donde buscar anotaciones de Swagger
};

// Inicializar Swagger
const specs = swaggerJsdoc(options);

// Función para configurar Swagger en la aplicación Express
function setupSwagger(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
  console.log('Swagger UI disponible en: http://localhost:3000/docs');
}

module.exports = { setupSwagger }; 