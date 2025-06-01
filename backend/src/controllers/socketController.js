const jwt = require('jsonwebtoken');
const { sendMessage } = require('./chatController');

// Middleware de autenticación para Socket.io
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
      return next(new Error('No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.roleId;
    next();
  } catch (error) {
    console.error('Error de autenticación Socket.io:', error);
    next(new Error('Authentication failed'));
  }
};

// Configurar Socket.io
const setupSocketIO = (io) => {
  // Middleware de autenticación
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.userId} (Rol: ${socket.userRole})`);

    // Unir al usuario al chat general
    socket.join('general');
    console.log(`Usuario ${socket.userId} unido al chat general`);

    // Unir a chat de zona
    socket.on('join-zone', (zoneId) => {
      try {
        const zoneRoom = `zone-${zoneId}`;
        socket.join(zoneRoom);
        console.log(`Usuario ${socket.userId} unido a zona ${zoneId}`);
        
        socket.emit('joined-zone', { 
          zoneId, 
          message: `Te has unido al chat de la zona ${zoneId}` 
        });
      } catch (error) {
        console.error('Error al unirse a zona:', error);
        socket.emit('error', { message: 'Error al unirse a la zona' });
      }
    });

    // Salir de chat de zona
    socket.on('leave-zone', (zoneId) => {
      try {
        const zoneRoom = `zone-${zoneId}`;
        socket.leave(zoneRoom);
        console.log(`❌ Usuario ${socket.userId} salió de zona ${zoneId}`);
        
        socket.emit('left-zone', { 
          zoneId, 
          message: `Has salido del chat de la zona ${zoneId}` 
        });
      } catch (error) {
        console.error('Error al salir de zona:', error);
      }
    });

    // Enviar mensaje
    socket.on('send-message', async (data) => {
      try {
        const { workZoneId, content } = data;
        
        // Validar contenido
        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'El mensaje no puede estar vacío' });
          return;
        }

        if (content.trim().length > 1000) {
          socket.emit('error', { message: 'El mensaje es demasiado largo (máximo 1000 caracteres)' });
          return;
        }

        // Enviar mensaje usando el controlador
        const result = await sendMessage({
          senderId: socket.userId,
          workZoneId: workZoneId || null,
          content: content.trim()
        });

        if (result.status === 'success') {
          const messageData = result.data;
          
          // Determinar a qué room enviar
          const room = workZoneId ? `zone-${workZoneId}` : 'general';
          
          // Emitir mensaje a todos los usuarios en el room
          io.to(room).emit('new-message', {
            id: messageData.id,
            content: messageData.content,
            sentAt: messageData.sentAt,
            sender: messageData.sender,
            workZone: messageData.workZone,
            isGeneral: !workZoneId
          });

          console.log(`Mensaje enviado por ${socket.userId} a ${room}`);
        }
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('error', { 
          message: 'Error al enviar mensaje: ' + error.message 
        });
      }
    });

    // Usuario escribiendo (typing indicator)
    socket.on('typing', (data) => {
      try {
        const { workZoneId, isTyping } = data;
        const room = workZoneId ? `zone-${workZoneId}` : 'general';
        
        socket.to(room).emit('user-typing', {
          userId: socket.userId,
          isTyping,
          workZoneId
        });
      } catch (error) {
        console.error('Error en typing indicator:', error);
      }
    });

    // Obtener usuarios online en una sala
    socket.on('get-online-users', async (data) => {
      try {
        const { workZoneId } = data;
        const room = workZoneId ? `zone-${workZoneId}` : 'general';
        
        const sockets = await io.in(room).fetchSockets();
        const onlineUsers = sockets.map(s => ({
          userId: s.userId,
          userRole: s.userRole
        }));

        socket.emit('online-users', {
          room,
          users: onlineUsers,
          count: onlineUsers.length
        });
      } catch (error) {
        console.error('Error al obtener usuarios online:', error);
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`desconectado: ${socket.userId}`);
    });

    // Manejo de errores
    socket.on('error', (error) => {
      console.error('Error de socket:', error);
    });
  });

  // Eventos globales
  io.engine.on('connection_error', (err) => {
    console.error('Error de conexión Socket.io:', err);
  });

  console.log('Socket.io configurado correctamente');
};

module.exports = { setupSocketIO }; 