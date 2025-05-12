const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { saveFile } = require('../utils/fileUtils');
const path = require('path');

const registerCheckIn = async (req, res) => {
    try {
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
        const now = new Date();
        // Crear fecha sin hora (solo año, mes, día)
        const workDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const checkIn = await prisma.checkIn.create({
            data: {
                user_id: userId,
                zone_id: zoneId,
                latitude: latitude,
                longitude: longitude,
                photo_url: photoUrl,
                status: 'active',
                checkOutTime: null,
                workDate: workDate
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

        // Formatear workDate
        const workDateCol = new Date(checkIn.workDate).toLocaleDateString('es-CO', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        res.status(201).json({
            id: checkIn.id,
            userId: checkIn.user_id,
            zoneId: checkIn.zone_id,
            checkInTime: checkInTimeCol,
            checkOutTime: checkIn.checkOutTime,
            workDate: workDateCol,
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
                checkInTime: 'desc'
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
                const checkInDate = new Date(checkIn.checkInTime);
                const workDate = new Date(checkIn.workDate);
                
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
                    checkOutTime: checkIn.checkOutTime ? new Date(checkIn.checkOutTime).toLocaleString('es-CO', {
                        timeZone: 'America/Bogota',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    }) : null,
                    workDate: workDate.toLocaleDateString('es-CO', {
                        timeZone: 'America/Bogota',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
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

const getTodayCheckIn = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Obtener la fecha actual en Colombia (UTC-5)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // Buscar el check-in del día actual
        const todayCheckIn = await prisma.checkIn.findFirst({
            where: {
                user_id: userId,
                workDate: {
                    gte: startOfDay,
                    lt: endOfDay
                }
            },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true
                    }
                },
                zone: {
                    select: {
                        name: true,
                        description: true
                    }
                }
            },
            orderBy: {
                checkInTime: 'desc'
            }
        });

        if (!todayCheckIn) {
            return res.status(404).json({
                message: 'No se encontró un check-in para el día de hoy'
            });
        }

        // Formatear las fechas a horario colombiano
        const checkInTimeCol = new Date(todayCheckIn.checkInTime).toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const checkOutTimeCol = todayCheckIn.checkOutTime ? 
            new Date(todayCheckIn.checkOutTime).toLocaleString('es-CO', {
                timeZone: 'America/Bogota',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }) : null;

        res.json([{
            id: todayCheckIn.id,
            employee_name: todayCheckIn.user.username,
            zone_name: todayCheckIn.zone.name,
            check_in_time: todayCheckIn.checkInTime,
            check_out_time: todayCheckIn.checkOutTime,
            status: todayCheckIn.status
        }]);
    } catch (error) {
        console.error('❌ Error al obtener el check-in del día:', error);
        res.status(500).json({
            message: 'Error al obtener el check-in del día',
            error: error.message
        });
    }
};

const registerCheckOut = async (req, res) => {
    try {
        const { checkInId } = req.body;
        if (!checkInId) {
            return res.status(400).json({ message: 'Falta el ID del check-in' });
        }
        const updatedCheckIn = await prisma.checkIn.update({
            where: { id: checkInId },
            data: {
                checkOutTime: new Date(),
                status: 'finished'
            }
        });
        res.json({
            message: 'Check-out registrado correctamente',
            checkIn: updatedCheckIn
        });
    } catch (error) {
        console.error('❌ Error al registrar check-out:', error);
        res.status(500).json({
            message: 'Error al registrar check-out',
            error: error.message
        });
    }
};

module.exports = {
    registerCheckIn,
    getRecentCheckIns,
    getTodayCheckIn,
    registerCheckOut
};