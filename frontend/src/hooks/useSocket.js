import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAuthToken } from '@/utils/cookies';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    const initializeSocket = () => {
      const token = getAuthToken();
      
      console.log('🔍 Buscando token de autenticación...');
      console.log('📝 Token encontrado:', token ? 'SÍ' : 'NO');
      
      if (!token) {
        setError('No authentication token found');
        console.error('❌ No se encontró token de autenticación');
        
        // Solo reintentar si no hemos superado el límite
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`🔄 Reintento ${retryCountRef.current}/${maxRetries} en 3 segundos...`);
          
          setTimeout(() => {
            initializeSocket();
          }, 3000);
        } else {
          console.log('❌ Límite de reintentos alcanzado. Verifique que esté logueado.');
          setError('No se pudo conectar al chat. Verifique que esté logueado correctamente.');
        }
        
        return;
      }

      // Reset retry count si encontramos token
      retryCountRef.current = 0;

      // Crear conexión Socket.io
      console.log('🔌 Creando conexión Socket.io...');
      socketRef.current = io(API_ENDPOINT, {
        auth: {
          token: token
        },
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      const socket = socketRef.current;

      // Event listeners
      socket.on('connect', () => {
        console.log('✅ Conectado a Socket.io');
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Desconectado de Socket.io:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Error de conexión Socket.io:', err);
        setError(err.message);
        setIsConnected(false);
        
        // Solo reintentar para errores de autenticación si no hemos superado el límite
        if ((err.message.includes('Authentication failed') || err.message.includes('No token provided')) 
            && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`🔄 Reintento de conexión ${retryCountRef.current}/${maxRetries} en 5 segundos...`);
          
          setTimeout(() => {
            initializeSocket();
          }, 5000);
        }
      });

      socket.on('error', (err) => {
        console.error('❌ Error Socket.io:', err);
        setError(err.message);
      });
    };

    initializeSocket();

    // Cleanup al desmontar
    return () => {
      if (socketRef.current) {
        console.log('🧹 Desconectando Socket.io...');
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Métodos para interactuar con el chat
  const joinZone = (zoneId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-zone', zoneId);
    }
  };

  const leaveZone = (zoneId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-zone', zoneId);
    }
  };

  const sendMessage = (messageData) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-message', messageData);
    }
  };

  const onNewMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('new-message', callback);
    }
  };

  const offNewMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('new-message', callback);
    }
  };

  const onJoinedZone = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('joined-zone', callback);
    }
  };

  const onLeftZone = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('left-zone', callback);
    }
  };

  const onTyping = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user-typing', callback);
    }
  };

  const emitTyping = (workZoneId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', { workZoneId, isTyping });
    }
  };

  const getOnlineUsers = (workZoneId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get-online-users', { workZoneId });
    }
  };

  const onOnlineUsers = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('online-users', callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    // Métodos
    joinZone,
    leaveZone,
    sendMessage,
    onNewMessage,
    offNewMessage,
    onJoinedZone,
    onLeftZone,
    onTyping,
    emitTyping,
    getOnlineUsers,
    onOnlineUsers
  };
}; 