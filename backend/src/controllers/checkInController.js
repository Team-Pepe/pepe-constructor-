const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { saveFile } = require('../utils/fileUtils');
const path = require('path');

const registerCheckIn = async (req, res) => {
    try {
        // Log detallado de los datos recibidos y sus tipos
        console.log('📥 Datos recibidos en el check-in:');
        console.log('zoneId:', { value: req.body.zoneId, type: typeof req.body.zoneId });
        console.log('latitude:', { value: req.body.latitude, type: typeof req.body.latitude });
        console.log('longitude:', { value: req.body.longitude, type: typeof req.body.longitude });
        console.log('photo:', { 
            exists: !!req.file,
            type: req.file?.mimetype,
            size: req.file?.size
        });

        // Convertir valores a sus tipos adecuados
        const zoneId = parseInt(req.body.zoneId);
        const latitude = parseFloat(req.body.latitude);
        const longitude = parseFloat(req.body.longitude);
        const userId = req.user.id;

        // Log de valores convertidos
        console.log('🔄 Valores convertidos:');
        console.log('zoneId:', { value: zoneId, type: typeof zoneId, isNaN: isNaN(zoneId) });
        console.log('latitude:', { value: latitude, type: typeof latitude, isNaN: isNaN(latitude) });
        console.log('longitude:', { value: longitude, type: typeof longitude, isNaN: isNaN(longitude) });

        // Validaciones mejoradas
        if (!req.body.zoneId || !req.body.latitude || !req.body.longitude) {
            console.log('❌ Error: Campos faltantes');
            return res.status(400).json({
                message: 'Faltan campos requeridos (zoneId, latitude, longitude)',
                received: {
                    zoneId: req.body.zoneId,
                    latitude: req.body.latitude,
                    longitude: req.body.longitude
                }
            });
        }

        if (isNaN(zoneId) || isNaN(latitude) || isNaN(longitude)) {
            console.log('❌ Error: Valores no numéricos');
            return res.status(400).json({
                message: 'Los valores deben ser numéricos',
                received: {
                    zoneId: { value: req.body.zoneId, parsed: zoneId },
                    latitude: { value: req.body.latitude, parsed: latitude },
                    longitude: { value: req.body.longitude, parsed: longitude }
                }
            });
        }

        // Validar que la zona existe
        const zone = await prisma.workZone.findUnique({
            where: { id: zoneId }
        });

        if (!zone) {
            console.log('❌ Error: Zona no encontrada:', zoneId);
            return res.status(404).json({
                message: 'La zona de trabajo no existe',
                zoneId: zoneId
            });
        }
        
        let photoUrl = null;
        if (req.file) {
            console.log('📸 Procesando foto del check-in:', {
                mimetype: req.file.mimetype,
                size: req.file.size
            });
            const result = await saveFile(req.file, 'checkin');
            
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
                zone_id: zoneId,
                latitude: latitude,
                longitude: longitude,
                photo_url: photoUrl,
                status: 'active'
            }
        });

        console.log('✅ Check-in registrado exitosamente:', checkIn);
        
        // Convertir la fecha a horario colombiano (UTC-5)
        const checkInDate = new Date(checkIn.checkInTime);
        const checkInTimeCol = checkInDate.toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        res.status(201).json({
            id: checkIn.id,
            userId: checkIn.user_id,
            zoneId: checkIn.zone_id,
            checkInTime: checkInTimeCol,
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
        const userId = parseInt(req.query.userId) || req.user.id;

        console.log('🔍 Buscando check-ins recientes:', { userId, limit });

        const checkIns = await prisma.checkIn.findMany({
            where: { 
                user_id: userId
            },
            take: limit,
            orderBy: { 
                check_in_time: 'desc'
            },
            include: {
                workZone: {
                    select: { name: true }
                }
            }
        });

        console.log(`✅ Se encontraron ${checkIns.length} check-ins`);
        res.json({
            checkIns: checkIns.map(checkIn => {
                const checkInDate = new Date(checkIn.check_in_time);
                return {
                    id: checkIn.id,
                    checkInTime: checkInDate.toLocaleString('es-CO', {
                        timeZone: 'America/Bogota',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    }),
                    zoneName: checkIn.workZone.name,
                    photoUrl: checkIn.photo_url,
                    status: checkIn.status
                };
            })
        });
    } catch (error) {
        console.error('❌ Error al obtener check-ins recientes:', error);
        res.status(500).json({ 
            message: 'Error al obtener check-ins recientes',
            error: error.message 
        });
    }
};

module.exports = {
    registerCheckIn,
    getRecentCheckIns
};