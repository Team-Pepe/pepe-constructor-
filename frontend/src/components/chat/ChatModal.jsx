import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Globe, Loader2, AlertCircle } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import axios from 'axios';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://pepe-constructor-md61.onrender.com';

export const ChatModal = ({ isOpen, onClose, workZones = [] }) => {
  const {
    isConnected,
    error: socketError,
    joinZone,
    sendMessage,
    onNewMessage,
    offNewMessage
  } = useSocket();

  // Estados
  const [activeTab, setActiveTab] = useState('general');
  const [messages, setMessages] = useState({
    general: [],
    zones: {}
  });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Referencias
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Obtener mensajes del servidor
  const fetchMessages = async (type, zoneId = null) => {
    try {
      setLoading(true);
      setError(null);

      const url = type === 'general' 
        ? `${API_ENDPOINT}/api/chat/general`
        : `${API_ENDPOINT}/api/chat/zone/${zoneId}`;

      const response = await axios.get(url, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        if (type === 'general') {
          setMessages(prev => ({
            ...prev,
            general: response.data.data
          }));
        } else {
          setMessages(prev => ({
            ...prev,
            zones: {
              ...prev.zones,
              [zoneId]: response.data.data
            }
          }));
        }
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
      setError('Error al cargar mensajes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar mensajes iniciales
  useEffect(() => {
    if (isOpen && isConnected) {
      fetchMessages('general');
    }
  }, [isOpen, isConnected]);

  // Configurar listeners de Socket.io
  useEffect(() => {
    if (isConnected) {
      const handleNewMessage = (messageData) => {
        console.log('Nuevo mensaje recibido:', messageData);
        
        if (messageData.isGeneral) {
          setMessages(prev => ({
            ...prev,
            general: [...prev.general, messageData]
          }));
        } else if (messageData.workZone) {
          const zoneId = messageData.workZone.id;
          setMessages(prev => ({
            ...prev,
            zones: {
              ...prev.zones,
              [zoneId]: [...(prev.zones[zoneId] || []), messageData]
            }
          }));
        }
      };

      onNewMessage(handleNewMessage);

      return () => {
        offNewMessage(handleNewMessage);
      };
    }
  }, [isConnected, onNewMessage, offNewMessage]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      content: newMessage.trim(),
      workZoneId: activeTab === 'general' ? null : parseInt(activeTab)
    };

    sendMessage(messageData);
    setNewMessage('');
    inputRef.current?.focus();
  };

  // Manejar cambio de tab
  const handleTabChange = (tabValue) => {
    setActiveTab(tabValue);
    
    // Si es una zona y no hemos cargado mensajes, cargarlos
    if (tabValue !== 'general') {
      const zoneId = parseInt(tabValue);
      if (!messages.zones[zoneId]) {
        fetchMessages('zone', zoneId);
        joinZone(zoneId);
      }
    }
  };

  // Formatear tiempo
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener rol display
  const getRoleDisplay = (roleId) => {
    const roles = {
      1: 'Supervisor',
      2: 'Trabajador', 
      3: 'Jefe de Obra',
      4: 'Admin'
    };
    return roles[roleId] || 'Usuario';
  };

  // Renderizar mensajes
  const renderMessages = (messagesList) => {
    if (!messagesList || messagesList.length === 0) {
      return (
        <div className="text-center text-slate-400 py-8">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay mensajes aún</p>
          <p className="text-sm">¡Sé el primero en escribir!</p>
        </div>
      );
    }

    return messagesList.map((message) => (
      <div key={message.id} className="mb-4 sm:mb-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {message.sender.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1 mb-1.5 sm:mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-medium text-white text-xs sm:text-sm">
                  {message.sender.username || 'Usuario'}
                </span>
                <Badge 
                  variant="outline" 
                  className="text-xs px-1.5 sm:px-2 py-0.5 border-slate-500 text-slate-300 bg-slate-700/50"
                >
                  {getRoleDisplay(message.sender.roleId)}
                </Badge>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400">
                {formatTime(message.sentAt)}
              </span>
            </div>
            <div className="bg-slate-700/70 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-white text-xs sm:text-sm border border-slate-600/50">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] max-h-[700px] p-4 sm:p-6 bg-slate-800 border-slate-700 shadow-2xl">
        <DialogHeader className="border-b border-slate-700 pb-4">
          <DialogTitle className="text-white flex flex-wrap items-center gap-3 text-base sm:text-xl">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Wasap 2
            {isConnected ? (
              <Badge className="bg-green-600 text-white border-0">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="destructive">Desconectado</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Comunícate en tiempo real con tu equipo a través del chat general o chats específicos por zona de trabajo.
          </DialogDescription>
        </DialogHeader>

        {/* Error de conexión */}
        {(socketError || error) && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm">
                {socketError || error}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col h-full">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
            <TabsList className="bg-slate-700/70 mb-4 p-1 rounded-lg overflow-x-auto flex-wrap gap-2">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md px-3 sm:px-4 py-1.5 sm:py-2 transition-all text-sm sm:text-base"
              >
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Chat General
              </TabsTrigger>
              {workZones.map((zone) => (
                <TabsTrigger 
                  key={zone.id} 
                  value={zone.id.toString()}
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md px-3 sm:px-4 py-1.5 sm:py-2 transition-all text-sm sm:text-base"
                >
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  {zone.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Chat General */}
            <TabsContent value="general" className="flex-1">
              <div className="flex flex-col h-full">
                <ScrollArea className="flex-1 pr-2 sm:pr-4 max-h-[calc(90vh-250px)] sm:max-h-[400px]">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                    </div>
                  ) : (
                    renderMessages(messages.general)
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Chats de Zona */}
            {workZones.map((zone) => (
              <TabsContent key={zone.id} value={zone.id.toString()} className="flex-1">
                <div className="flex flex-col h-full">
                  <ScrollArea className="flex-1 pr-2 sm:pr-4 max-h-[calc(90vh-250px)] sm:max-h-[400px]">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                      </div>
                    ) : (
                      renderMessages(messages.zones[zone.id] || [])
                    )}
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Input de mensaje */}
          <div className="border-t border-slate-600/50 pt-3 sm:pt-4 mt-3 sm:mt-4 bg-slate-900/30 rounded-lg p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Escribe un mensaje en ${activeTab === 'general' ? 'Chat General' : workZones.find(z => z.id.toString() === activeTab)?.name || 'esta zona'}...`}
                className="bg-slate-700 border-slate-600 text-white text-sm placeholder:text-slate-400 flex-1 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={!isConnected}
                maxLength={1000}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="bg-orange-600 hover:bg-orange-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
            {newMessage.length > 800 && (
              <p className="text-xs text-slate-400 mt-2">
                {1000 - newMessage.length} caracteres restantes
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};