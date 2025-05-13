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
                checkInTime: now, // Asegurarnos de que se guarde la fecha actual
                latitude: latitude,
                longitude: longitude,
                photo_url: photoUrl,
                status: 'active',
                checkOutTime: null,
                workDate: workDate
            }
        });

        console.log('✅ Check-in registrado exitosamente:', checkIn);
        
        // Formatear la fecha de check-in
        let check_in_time = null;
        try {
            const checkInDate = new Date(now);
            if (!isNaN(checkInDate.getTime())) {
                check_in_time = checkInDate.toLocaleString('es-CO', {
                    timeZone: 'America/Bogota',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
            }
        } catch (error) {
            console.warn('⚠️ Error al formatear check-in time:', error);
        }

        // Formatear workDate
        let workDateCol = null;
        try {
            const workDateObj = new Date(workDate);
            if (!isNaN(workDateObj.getTime())) {
                workDateCol = workDateObj.toLocaleDateString('es-CO', {
                    timeZone: 'America/Bogota',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            }
        } catch (error) {
            console.warn('⚠️ Error al formatear workDate:', error);
        }

        const response = {
            id: checkIn.id.toString(),
            userId: checkIn.user_id.toString(),
            zoneId: checkIn.zone_id?.toString() || null,
            check_in_time: check_in_time,
            check_out_time: null,
            workDate: workDateCol,
            photoUrl: checkIn.photo_url,
            status: checkIn.status
        };

        console.log('📤 Enviando respuesta:', response);
        res.status(201).json(response);
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
        const userId = req.user?.id;

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
                checkInTime: 'desc'
            }
        });

        const formattedCheckIns = checkIns.map(checkIn => {
            // Formatear check-in time
            let check_in_time = null;
            if (checkIn.checkInTime) {
                try {
                    const checkInDate = new Date(checkIn.checkInTime);
                    if (!isNaN(checkInDate.getTime())) {
                        check_in_time = checkInDate.toLocaleString('es-CO', {
                            timeZone: 'America/Bogota',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        });
                    }
                } catch (error) {
                    console.warn('⚠️ Error al formatear check-in time:', error);
                }
            }

            // Formatear check-out time
            let check_out_time = null;
            if (checkIn.checkOutTime) {
                try {
                    const checkOutDate = new Date(checkIn.checkOutTime);
                    if (!isNaN(checkOutDate.getTime())) {
                        check_out_time = checkOutDate.toLocaleString('es-CO', {
                            timeZone: 'America/Bogota',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        });
                    }
                } catch (error) {
                    console.warn('⚠️ Error al formatear check-out time:', error);
                }
            }

            return {
                id: checkIn.id?.toString(),
                user_id: checkIn.user_id?.toString(),
                zone_id: checkIn.zone_id?.toString() || null,
                check_in_time: check_in_time,
                check_out_time: check_out_time,
                status: checkIn.status || 'unknown'
            };
        });

        res.json(formattedCheckIns);
    } catch (error) {
        console.error('❌ Error al obtener check-ins recientes:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Error al obtener check-ins recientes',
            error: error.message 
        });
    }
};

const getTodayCheckIn = async (req, res) => {
    try {
        console.log('🔍 Iniciando búsqueda de check-ins del día...');
        
        // Obtener la fecha actual en Colombia (UTC-5)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        
        console.log('📅 Rango de fechas:', {
            startOfDay: startOfDay.toISOString(),
            endOfDay: endOfDay.toISOString()
        });

        // Buscar todos los check-ins del día actual
        console.log('🔎 Consultando base de datos...');
        const todayCheckIns = await prisma.checkIn.findMany({
            where: {
                workDate: {
                    gte: startOfDay,
                    lt: endOfDay
                }
            },
            orderBy: {
                checkInTime: 'desc'
            }
        });

        console.log(`📊 Se encontraron ${todayCheckIns.length} check-ins`);

        if (todayCheckIns.length === 0) {
            console.log('❌ No se encontraron check-ins para el día de hoy');
            return res.status(404).json({
                message: 'No se encontraron check-ins para el día de hoy'
            });
        }

        // Obtener información de usuarios y zonas
        const userIds = [...new Set(todayCheckIns.map(checkIn => checkIn.user_id))];
        const zoneIds = [...new Set(todayCheckIns.map(checkIn => checkIn.zone_id).filter(Boolean))];

        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                username: true,
                email: true
            }
        });

        const zones = await prisma.workZone.findMany({
            where: { id: { in: zoneIds } },
            select: {
                id: true,
                name: true,
                description: true
            }
        });

        // Crear mapas para acceso rápido
        const userMap = new Map(users.map(user => [user.id, user]));
        const zoneMap = new Map(zones.map(zone => [zone.id, zone]));

        // Formatear las fechas y preparar la respuesta
        console.log('🕒 Formateando fechas y preparando respuesta...');
        const formattedCheckIns = todayCheckIns.map(checkIn => {
            // Formatear check-in time
            let check_in_time = null;
            if (checkIn.checkInTime) {
                try {
                    const checkInDate = new Date(checkIn.checkInTime);
                    if (!isNaN(checkInDate.getTime())) {
                        check_in_time = checkInDate.toLocaleString('es-CO', {
                            timeZone: 'America/Bogota',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        });
                    }
                } catch (error) {
                    console.warn('⚠️ Error al formatear check-in time:', error);
                }
            }

            // Formatear check-out time
            let check_out_time = null;
            if (checkIn.checkOutTime) {
                try {
                    const checkOutDate = new Date(checkIn.checkOutTime);
                    if (!isNaN(checkOutDate.getTime())) {
                        check_out_time = checkOutDate.toLocaleString('es-CO', {
                            timeZone: 'America/Bogota',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                        });
                    }
                } catch (error) {
                    console.warn('⚠️ Error al formatear check-out time:', error);
                }
            }

            const user = userMap.get(checkIn.user_id);
            const zone = checkIn.zone_id ? zoneMap.get(checkIn.zone_id) : null;

            return {
                id: checkIn.id?.toString(),
                user_id: checkIn.user_id?.toString(),
                zone_id: checkIn.zone_id?.toString() || null,
                employee_name: user?.username || 'Usuario no encontrado',
                zone_name: zone?.name || 'Zona no especificada',
                check_in_time: check_in_time,
                check_out_time: check_out_time,
                status: checkIn.status || 'unknown'
            };
        });

        console.log('📤 Enviando respuesta con', formattedCheckIns.length, 'check-ins');
        res.json(formattedCheckIns);
    } catch (error) {
        console.error('❌ Error detallado al obtener los check-ins del día:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            message: 'Error al obtener los check-ins del día',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
        });
    }
};

const registerCheckOut = async (req, res) => {
    try {
        const { checkInId } = req.body;
        if (!checkInId) {
            return res.status(400).json({ message: 'Falta el ID del check-in' });
        }

        console.log('🔄 Registrando check-out para check-in:', checkInId);
        
        const updatedCheckIn = await prisma.checkIn.update({
            where: { id: BigInt(checkInId) }, // Convertir a BigInt para la consulta
            data: {
                checkOutTime: new Date(),
                status: 'finished'
            }
        });

        // Formatear la fecha de check-out
        let check_out_time = null;
        if (updatedCheckIn.checkOutTime) {
            try {
                const checkOutDate = new Date(updatedCheckIn.checkOutTime);
                if (!isNaN(checkOutDate.getTime())) {
                    check_out_time = checkOutDate.toLocaleString('es-CO', {
                        timeZone: 'America/Bogota',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    });
                }
            } catch (error) {
                console.warn('⚠️ Error al formatear check-out time:', error);
            }
        }

        // Formatear la fecha de check-in
        let check_in_time = null;
        if (updatedCheckIn.checkInTime) {
            try {
                const checkInDate = new Date(updatedCheckIn.checkInTime);
                if (!isNaN(checkInDate.getTime())) {
                    check_in_time = checkInDate.toLocaleString('es-CO', {
                        timeZone: 'America/Bogota',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    });
                }
            } catch (error) {
                console.warn('⚠️ Error al formatear check-in time:', error);
            }
        }

        // Preparar respuesta con todos los BigInt convertidos a string
        const response = {
            id: updatedCheckIn.id.toString(),
            user_id: updatedCheckIn.user_id.toString(),
            zone_id: updatedCheckIn.zone_id?.toString() || null,
            check_in_time: check_in_time,
            check_out_time: check_out_time,
            status: updatedCheckIn.status,
            workDate: updatedCheckIn.workDate?.toISOString() || null
        };

        console.log('✅ Check-out registrado correctamente:', response);
        res.json(response);
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