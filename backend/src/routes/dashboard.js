const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to convert BigInt values to numbers
function convertBigIntToNumber(data) {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return Number(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => convertBigIntToNumber(item));
  }
  
  if (typeof data === 'object') {
    const newObj = {};
    for (const key in data) {
      newObj[key] = convertBigIntToNumber(data[key]);
    }
    return newObj;
  }
  
  return data;
}

// Obtener métricas generales del dashboard
router.get('/metrics', async (req, res) => {
    try {
        // Contar tareas y usuarios
        const [tasks, users] = await Promise.all([
            prisma.task.count(),
            prisma.user.count({
                where: {
                    role: 'WORKER' // Asumiendo que hay un rol para trabajadores
                }
            })
        ]);

        res.json({
            activeProjects: 0, // No hay tabla projects en la DB actual
            workers: users,
            tasks
        });
    } catch (error) {
        console.error('Error en /metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener progreso de zonas de trabajo (en lugar de proyectos)
router.get('/projects-progress', async (req, res) => {
    try {
        const workZones = await prisma.workZone.findMany({
            include: {
                supervisor: true,
                tasks: {
                    where: {
                        status: 'PENDING'
                    }
                }
            }
        });

        const formattedWorkZones = workZones.map(zone => ({
            id: Number(zone.id),
            title: zone.name,
            progress: 0, // Calcular basado en tareas completadas/total
            workers: 0, // No tenemos relación directa worker-workzone
            tasks: zone.tasks.length
        }));

        res.json(formattedWorkZones);
    } catch (error) {
        console.error('Error en /projects-progress:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener asistencia actual
router.get('/attendance', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findMany({
            where: {
                checkIn: {
                    gte: today
                }
            },
            include: {
                // No tenemos relación directa con users en el schema actual
            }
        });

        const formattedAttendance = attendance.map(record => ({
            id: Number(record.id),
            userId: record.userId ? Number(record.userId) : null,
            status: "PRESENT", // Valor por defecto
            time: record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : null
        }));

        res.json(formattedAttendance);
    } catch (error) {
        console.error('Error en /attendance:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener estado de materiales
router.get('/materials', async (req, res) => {
    try {
        const materials = await prisma.material.findMany({
            select: {
                id: true,
                name: true,
                quantity: true
            }
        });

        const formattedMaterials = materials.map(material => ({
            id: Number(material.id),
            name: material.name,
            used: 0, // Calcular basado en solicitudes
            total: material.quantity,
            unit: 'unidades' // Valor por defecto
        }));

        res.json(formattedMaterials);
    } catch (error) {
        console.error('Error en /materials:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener actividades recientes
router.get('/recent-activities', async (req, res) => {
    try {
        const activities = await Promise.all([
            // Obtener últimas tareas completadas
            prisma.task.findMany({
                where: {
                    status: 'COMPLETED'
                },
                take: 3,
                orderBy: {
                    completionDate: 'desc'
                },
                include: {
                    workZone: true,
                    user: true
                }
            }),
            // Obtener últimas solicitudes de materiales
            prisma.request.findMany({
                take: 2,
                orderBy: {
                    requestDate: 'desc'
                },
                include: {
                    user: true,
                    material: true
                }
            })
        ]);

        let [tasks, requests] = activities;
        
        // Convert BigInt to regular numbers
        tasks = convertBigIntToNumber(tasks);
        requests = convertBigIntToNumber(requests);

        const formattedActivities = [
            ...tasks.map(task => ({
                id: `task-${task.id}`,
                title: 'Tarea Completada',
                description: `${task.user ? task.user.username : 'Usuario'} completó: ${task.description}`,
                location: task.workZone ? task.workZone.name : 'Desconocido',
                time: task.completionDate ? new Date(task.completionDate).toLocaleString() : 'Fecha desconocida'
            })),
            ...requests.map(request => ({
                id: `request-${request.id}`,
                title: 'Solicitud de Material',
                description: `${request.user ? request.user.username : 'Usuario'} solicitó ${request.material ? request.material.name : 'material'}`,
                time: new Date(request.requestDate).toLocaleString()
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json(formattedActivities);
    } catch (error) {
        console.error('Error en /recent-activities:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 