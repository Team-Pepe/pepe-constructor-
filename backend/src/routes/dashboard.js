const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener métricas generales del dashboard
router.get('/metrics', async (req, res) => {
    try {
        const [
            activeProjects,
            workers,
            tasks
        ] = await Promise.all([
            // Obtener proyectos activos
            prisma.project.count({
                where: {
                    status: 'ACTIVE'
                }
            }),
            // Obtener total de trabajadores
            prisma.worker.count(),
            // Obtener total de tareas
            prisma.task.count()
        ]);

        res.json({
            activeProjects,
            workers,
            tasks
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener progreso de obras
router.get('/projects-progress', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                progress: true,
                workers: {
                    select: {
                        id: true
                    }
                },
                tasks: {
                    where: {
                        status: 'PENDING'
                    },
                    select: {
                        id: true
                    }
                }
            }
        });

        const formattedProjects = projects.map(project => ({
            id: project.id,
            title: project.name,
            progress: project.progress,
            workers: project.workers.length,
            tasks: project.tasks.length
        }));

        res.json(formattedProjects);
    } catch (error) {
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
                date: {
                    gte: today
                }
            },
            select: {
                id: true,
                worker: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                status: true,
                checkIn: true
            }
        });

        const formattedAttendance = attendance.map(record => ({
            id: record.id,
            name: record.worker.name,
            role: record.worker.role,
            status: record.status,
            time: record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : null
        }));

        res.json(formattedAttendance);
    } catch (error) {
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
                used: true,
                total: true,
                unit: true
            }
        });

        res.json(materials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener actividades recientes
router.get('/recent-activities', async (req, res) => {
    try {
        const activities = await prisma.activity.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true
            }
        });

        const formattedActivities = activities.map(activity => ({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            time: new Date(activity.createdAt).toLocaleString()
        }));

        res.json(formattedActivities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 