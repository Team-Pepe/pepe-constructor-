const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para convertir coordenadas a formato WKT para PostGIS
function pointToWKT(lat, lng, srid = 4326) {
  return `SRID=${srid};POINT(${lng} ${lat})`;
}

async function main() {
  try {
    console.log('Iniciando la carga de datos de ejemplo...');

    // Crear usuarios
    const user1 = await prisma.User.upsert({
      where: { email: 'supervisor@pepe.com' },
      update: {},
      create: {
        email: 'supervisor@pepe.com',
        username: 'Supervisor Principal',
      },
    });

    const user2 = await prisma.User.upsert({
      where: { email: 'trabajador1@pepe.com' },
      update: {},
      create: {
        email: 'trabajador1@pepe.com',
        username: 'Trabajador Uno',
      },
    });

    const user3 = await prisma.User.upsert({
      where: { email: 'trabajador2@pepe.com' },
      update: {},
      create: {
        email: 'trabajador2@pepe.com',
        username: 'Trabajador Dos',
      },
    });

    console.log('Usuarios creados:', { user1, user2, user3 });

    // Crear roles
    const role1 = await prisma.Role.create({
      data: {
        roleName: 'Administrador',
        permissions: 'all',
      },
    });

    const role2 = await prisma.Role.create({
      data: {
        roleName: 'Supervisor',
        permissions: 'manage_workers,manage_tasks,view_reports',
      },
    });

    const role3 = await prisma.Role.create({
      data: {
        roleName: 'Trabajador',
        permissions: 'view_tasks,update_tasks',
      },
    });

    console.log('Roles creados:', { role1, role2, role3 });

    // Crear materiales
    const material1 = await prisma.Material.create({
      data: {
        name: 'Cemento',
        description: 'Cemento Portland Tipo I',
        quantity: 100,
      },
    });

    const material2 = await prisma.Material.create({
      data: {
        name: 'Arena',
        description: 'Arena fina para construcción',
        quantity: 200,
      },
    });

    const material3 = await prisma.Material.create({
      data: {
        name: 'Ladrillos',
        description: 'Ladrillos de arcilla estándar',
        quantity: 1000,
      },
    });

    console.log('Materiales creados:', { material1, material2, material3 });

    // Crear zonas de trabajo
    const workZone1 = await prisma.WorkZone.create({
      data: {
        name: 'Zona A - Cimentación',
        description: 'Área de cimentación del edificio principal',
        supervisorId: user1.id,
      },
    });

    const workZone2 = await prisma.WorkZone.create({
      data: {
        name: 'Zona B - Estructura',
        description: 'Área de estructura del edificio principal',
        supervisorId: user1.id,
      },
    });

    console.log('Zonas de trabajo creadas:', { workZone1, workZone2 });

    // Crear tareas
    const task1 = await prisma.Task.create({
      data: {
        workZoneId: workZone1.id,
        assignedToId: user2.id,
        description: 'Preparar el terreno para la cimentación',
        status: 'pendiente',
        completionDate: null,
        evidenceUrl: null,
      },
    });

    const task2 = await prisma.Task.create({
      data: {
        workZoneId: workZone1.id,
        assignedToId: user3.id,
        description: 'Colocar el acero de refuerzo',
        status: 'en_progreso',
        completionDate: null,
        evidenceUrl: null,
      },
    });

    const task3 = await prisma.Task.create({
      data: {
        workZoneId: workZone2.id,
        assignedToId: user2.id,
        description: 'Levantar muros de carga',
        status: 'pendiente',
        completionDate: null,
        evidenceUrl: null,
      },
    });

    console.log('Tareas creadas:', { task1, task2, task3 });

    // Crear solicitudes de materiales
    const request1 = await prisma.Request.create({
      data: {
        userId: user2.id,
        materialId: material1.id,
        requestDate: new Date(),
        status: 'pendiente',
      },
    });

    const request2 = await prisma.Request.create({
      data: {
        userId: user3.id,
        materialId: material3.id,
        requestDate: new Date(),
        status: 'aprobada',
      },
    });

    console.log('Solicitudes creadas:', { request1, request2 });

    // Crear métricas
    const metric1 = await prisma.Metric.create({
      data: {
        workZoneId: workZone1.id,
        metricType: 'avance',
        value: 25.5,
        recordedAt: new Date(),
      },
    });

    const metric2 = await prisma.Metric.create({
      data: {
        workZoneId: workZone2.id,
        metricType: 'avance',
        value: 10.0,
        recordedAt: new Date(),
      },
    });

    console.log('Métricas creadas:', { metric1, metric2 });

    // Crear mensajes
    const message1 = await prisma.Message.create({
      data: {
        senderId: user1.id,
        receiverId: user2.id,
        message: 'Por favor, revisa el avance de la cimentación',
        sentAt: new Date(),
      },
    });

    const message2 = await prisma.Message.create({
      data: {
        senderId: user2.id,
        receiverId: user1.id,
        message: 'Necesitamos más cemento para continuar',
        sentAt: new Date(),
      },
    });

    console.log('Mensajes creados:', { message1, message2 });

    // Crear registros de asistencia con formato WKT para la ubicación
    // Usamos el formato SRID=4326;POINT(longitud latitud)
    const attendance1 = await prisma.Attendance.create({
      data: {
        userId: user2.id,
        checkIn: new Date(new Date().setHours(8, 0, 0, 0)),
        checkOut: new Date(new Date().setHours(17, 0, 0, 0)),
        location: pointToWKT(-12.046374, -77.042793), // Lima, Perú
      },
    });

    const attendance2 = await prisma.Attendance.create({
      data: {
        userId: user3.id,
        checkIn: new Date(new Date().setHours(8, 15, 0, 0)),
        checkOut: null, // Aún no ha salido
        location: pointToWKT(-12.048813, -77.045235), // Cerca de Lima, Perú
      },
    });

    console.log('Registros de asistencia creados:', { attendance1, attendance2 });

    console.log('Datos de ejemplo cargados correctamente');
  } catch (error) {
    console.error('Error al cargar datos de ejemplo:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 