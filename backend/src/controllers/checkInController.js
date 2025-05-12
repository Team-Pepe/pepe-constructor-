const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { saveFile } = require('../utils/fileUtils');
const path = require('path');

const registerCheckIn = async (req, res) => {
    try {
        console.log('📥 Recibiendo solicitud de check-in:', {
            body: req.body,
            file: req.file ? { ...req.file, buffer: 'Buffer...' } : null
        });

        const { zoneId, latitude, longitude } = req.body;
        const userId = req.user.id;

        // Validaciones
        if (!zoneId || !latitude || !longitude) {
            return res.status(400).json({
                message: 'Faltan campos requeridos (zoneId, latitude, longitude)'
            });
        }

        // Validar que la zona existe
        const zone = await prisma.workZone.findUnique({
            where: { id: parseInt(zoneId) }
        });

        if (!zone) {
            return res.status(404).json({
                message: 'La zona de trabajo no existe'
            });
        }
        
        let photoUrl = null;
        if (req.file) {
            console.log('📸 Procesando foto del check-in...');
            const result = await saveFile(req.file, 'check-ins');
            
            if (!result.success) {
                console.error('❌ Error al guardar la foto:', result.message);
                throw new Error('Error al guardar la foto: ' + result.message);
            }
            
            photoUrl = result.url;
            console.log('✅ Foto guardada exitosamente:', photoUrl);
        }

        console.log('💾 Guardando check-in en la base de datos...');
        const checkIn = await prisma.checkIn.create({
            data: {
                user_id: userId,
                zone_id: parseInt(zoneId),
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                photo_url: photoUrl,
                status: 'active'
            }
        });

        console.log('✅ Check-in registrado exitosamente:', checkIn);
        res.status(201).json({
            id: checkIn.id,
            userId: checkIn.user_id,
            zoneId: checkIn.zone_id,
            checkInTime: checkIn.check_in_time.toISOString(),
            photoUrl: checkIn.photo_url,
            status: checkIn.status
        });
    } catch (error) {
        console.error('❌ Error al registrar check-in:', error);
        res.status(500).json({ 
            message: 'Error al registrar check-in',
            error: error.message 
        });
    }
};

const getRecentCheckIns = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const userId = req.user?.id; // Obtener del token de autenticación

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuario no autenticado'
            });
        }

        console.log('🔍 Buscando check-ins recientes:', { userId, limit });

        const checkIns = await prisma.CheckIn.findMany({
            where: { 
                user_id: userId
            },
            take: limit,
            orderBy: { 
                check_in_time: 'desc'
            },
            include: {
                workZone: {
                    select: { 
                        id: true,
                        name: true 
                    }
                }
            }
        });

        res.json({
            status: 'success',
            data: checkIns.map(checkIn => ({
                id: checkIn.id,
                checkInTime: checkIn.check_in_time.toISOString(),
                zoneName: checkIn.workZone?.name || 'Zona desconocida',
                zoneId: checkIn.workZone?.id,
                photoUrl: checkIn.photo_url,
                status: checkIn.status,
                latitude: checkIn.latitude,
                longitude: checkIn.longitude
            }))
        });

    } catch (error) {
        console.error('❌ Error al obtener check-ins recientes:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Error al obtener check-ins recientes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    registerCheckIn,
    getRecentCheckIns
};