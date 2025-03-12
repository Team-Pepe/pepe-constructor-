const { PrismaClient } = require('@prisma/client');

// Instancia del cliente Prisma con opciones de logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Función para verificar la conexión a la base de datos
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return false;
  }
}

// Exportamos el cliente y la función de prueba
module.exports = {
  prisma,
  testConnection,
};
