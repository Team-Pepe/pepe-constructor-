const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { saveFile } = require('../utils/fileUtils');

// Obtener métricas generales del dashboard
router.get('/metrics', async (req, res) => {
    try {
        // Contar tareas, usuarios con rol de trabajador y solicitudes pendientes
        const [tasks, workers, pendingRequests] = await Promise.all([
            prisma.task.count(),
            prisma.user.count({
                where: {
                    role: {
                        is: {
                            roleName: 'WORKER'
                        }
                    }
                }
            }),
            prisma.materialRequest.count({
                where: {
                    status: 'pending'
                }
            })
        ]);

        res.json({
            activeProjects: 0, // No hay tabla projects en la DB actual
            workers,
            tasks,
            pendingRequests
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
        // Obtener todos los materiales
        const materials = await prisma.material.findMany({
            select: {
                id: true,
                name: true,
                quantity: true
            }
        });

        // Obtener todas las solicitudes de materiales
        const materialRequests = await prisma.materialRequest.findMany({
            where: {
                status: 'approved'
            }
        });

        // Calcular el uso de materiales basado en solicitudes
        const materialUsageMap = {};
        materialRequests.forEach(request => {
            if (!materialUsageMap[request.material]) {
                materialUsageMap[request.material] = 0;
            }
            materialUsageMap[request.material] += request.quantity_requested;
        });

        const formattedMaterials = materials.map(material => {
            // Buscar solicitudes para este material por nombre
            const used = materialUsageMap[material.name] || 0;
            
            return {
                id: material.id,
                name: material.name,
                used: used,
                total: material.quantity,
                unit: 'unidades', // Valor por defecto
                // Calcular porcentaje de uso
                usage: material.quantity > 0 ? Math.round((used / material.quantity) * 100) : 0
            };
        });

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
        
        // Obtener solicitudes de materiales sin incluir users
        const requests = await prisma.materialRequest.findMany({
            take: 2,
            orderBy: {
                created_at: 'desc'
            }
        });
        
        // Obtener usuarios relacionados (de tareas y solicitudes)
        const userIds = [
            ...tasks.map(task => task.assignedTo),
            ...requests.map(request => request.user_id).filter(Boolean)
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

        // Formatear actividades
        const formattedActivities = [
            ...tasks.map(task => ({
                id: `task-${task.id}`,
                title: 'Tarea Completada',
                description: `${userMap[task.assignedTo]?.username || 'Usuario'} completó: ${task.description}`,
                time: task.completionDate ? new Date(task.completionDate).toLocaleString() : 'Fecha desconocida',
                location: task.workZone?.name || 'Zona de trabajo'
            })),
            ...requests.map(request => ({
                id: `request-${request.id?.toString()}`,
                title: 'Solicitud de Material',
                description: `${userMap[request.user_id]?.username || 'Usuario'} solicitó ${request.quantity_requested} unidades de ${request.material}`,
                time: request.created_at ? new Date(request.created_at).toLocaleString() : 'Fecha desconocida',
                location: 'Almacén'
            }))
        ];

        // Ordenar por fecha, ahora usando el campo time que tiene formato localizado
        formattedActivities.sort((a, b) => {
            const dateA = a.time === 'Fecha desconocida' ? new Date(0) : new Date(a.time);
            const dateB = b.time === 'Fecha desconocida' ? new Date(0) : new Date(b.time);
            return dateB - dateA;
        });

        res.json(formattedActivities.slice(0, 5)); // Limitar a 5 actividades
    } catch (error) {
        console.error('Error en /recent-activities:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener solicitudes de materiales recientes
router.get('/material-requests', async (req, res) => {
    try {
        // Obtener solicitudes sin incluir user
        const materialRequests = await prisma.materialRequest.findMany({
            take: 10, // Mostrar las 10 solicitudes más recientes
            orderBy: {
                created_at: 'desc'
            }
        });

        // Obtener usuarios relacionados
        const userIds = [...new Set(materialRequests.map(req => req.user_id).filter(Boolean))];
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

        const formattedRequests = materialRequests.map(request => ({
            id: request.id?.toString(),
            material: request.material,
            quantity: request.quantity_requested,
            status: request.status,
            date: request.created_at ? new Date(request.created_at).toLocaleString() : 'Fecha desconocida',
            user: userMap[request.user_id]?.username || userMap[request.user_id]?.email || 'Usuario desconocido',
            message: request.message || 'Sin mensaje'
        }));

        res.json(formattedRequests);
    } catch (error) {
        console.error('Error en /material-requests:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;