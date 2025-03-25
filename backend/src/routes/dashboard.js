const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener métricas generales del dashboard
router.get('/metrics', async (req, res) => {
    try {
        // Contar tareas y usuarios con rol de trabajador
        const [tasks, workers] = await Promise.all([
            prisma.task.count(),
            prisma.user.count({
                where: {
                    role: {
                        is: {
                            roleName: 'WORKER'
                        }
                    }
                }
            })
        ]);

        res.json({
            activeProjects: 0, // No hay tabla projects en la DB actual
            workers,
            tasks
        });
    } catch (error) {
        console.error('Error en /metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener progreso de zonas de trabajo
router.get('/projects-progress', async (req, res) => {
    try {
        const workZones = await prisma.workZone.findMany({
            include: {
                supervisor: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
                tasks: {
                    where: {
                        status: 'PENDING'
                    }
                }
            }
        });

        const formattedWorkZones = workZones.map(zone => ({
            id: zone.id,
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
            }
        });

        // Obtenemos los usuarios en una consulta separada
        const userIds = attendance.map(record => record.userId);
        
        // Solo seleccionamos los campos que existen
        const users = await prisma.user.findMany({
            where: {
                id: {
                    in: userIds
                }
            },
            select: {
                id: true,
                username: true,
                email: true
            }
        });
        
        // Creamos un mapa para acceso rápido
        const userMap = {};
        users.forEach(user => {
            userMap[user.id] = user;
        });

        const formattedAttendance = attendance.map(record => ({
            id: record.id,
            name: userMap[record.userId]?.username || 'Usuario',
            userId: record.userId,
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
            id: material.id,
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
        // Obtener tareas completadas
        const tasks = await prisma.task.findMany({
            where: {
                status: 'COMPLETED'
            },
            take: 3,
            orderBy: {
                completionDate: 'desc'
            },
            include: {
                workZone: true
            }
        });
        
        // Obtener solicitudes de materiales
        const requests = await prisma.request.findMany({
            take: 2,
            orderBy: {
                requestDate: 'desc'
            },
            include: {
                material: true
            }
        });
        
        // Obtener usuarios relacionados
        const userIds = [
            ...tasks.map(task => task.assignedTo),
            ...requests.map(request => request.userId)
        ];
        
        // Solo seleccionamos los campos que existen
        const users = await prisma.user.findMany({
            where: {
                id: {
                    in: userIds
                }
            },
            select: {
                id: true,
                username: true,
                email: true
            }
        });
        
        // Crear mapa de usuarios
        const userMap = {};
        users.forEach(user => {
            userMap[user.id] = user;
        });

        const formattedActivities = [
            ...tasks.map(task => ({
                id: `task-${task.id}`,
                title: 'Tarea Completada',
                description: `${userMap[task.assignedTo]?.username || 'Usuario'} completó: ${task.description}`,
                location: task.workZone?.name || 'Zona de trabajo',
                time: task.completionDate ? new Date(task.completionDate).toLocaleString() : 'Fecha desconocida'
            })),
            ...requests.map(request => ({
                id: `request-${request.id}`,
                title: 'Solicitud de Material',
                description: `${userMap[request.userId]?.username || 'Usuario'} solicitó ${request.material?.name || 'material'}`,
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