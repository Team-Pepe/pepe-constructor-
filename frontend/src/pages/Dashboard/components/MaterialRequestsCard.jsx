import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchMaterialRequests, updateMaterialRequestStatus, createActivity } from "@/services/dashboardService";

export function MaterialRequestsCard({ onRefresh, onActivityAdd }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(null);

  // Load material requests when component mounts
  useEffect(() => {
    loadRequests();
  }, []);

  // Function to load material requests from backend
  const loadRequests = async () => {
    try {
      setLoading(true);
      console.log("Cargando solicitudes de materiales pendientes...");
      const response = await fetchMaterialRequests("pending");
      console.log("Solicitudes cargadas:", response);
      
      if (response.success) {
        if (import.meta.env.DEV) {
          console.log("Datos de solicitudes recibidos:", response.data);
        }
        
        // Process requests and ensure they have dates
        const processedRequests = (response.data || []).map((request, index) => {
          // Log the first request to see what date fields are available (development only)
          if (index === 0 && import.meta.env.DEV) {
            console.log("Primer request para debugging:", request);
            console.log("Campos de fecha disponibles:", {
              created_at: request.created_at,
              createdAt: request.createdAt,
              date_created: request.date_created,
              dateCreated: request.dateCreated,
              fecha_creacion: request.fecha_creacion,
              timestamp: request.timestamp,
              fecha: request.fecha,
              id: request.id
            });
          }
          
          // Check if request has any valid date field
          const hasValidDate = [
            request.created_at,
            request.createdAt,
            request.date_created,
            request.dateCreated,
            request.fecha_creacion,
            request.timestamp,
            request.fecha,
            request.updated_at,
            request.updatedAt
          ].some(dateField => {
            if (!dateField) return false;
            try {
              const date = new Date(dateField);
              return !isNaN(date.getTime());
            } catch {
              return false;
            }
          });
          
          // If no valid date, assign one based on request order (recent first)
          if (!hasValidDate) {
            const fallbackDate = new Date();
            fallbackDate.setMinutes(fallbackDate.getMinutes() - index); // Stagger by minutes
            return {
              ...request,
              created_at: fallbackDate.toISOString(),
              _hasGeneratedDate: true // Flag to indicate this date was generated
            };
          }
          
          return request;
        });
        
        setRequests(processedRequests);
      } else {
        console.error("Error al cargar solicitudes:", response.error);
        setRequests([]);
      }
    } catch (error) {
      console.error("Error inesperado al cargar solicitudes de materiales:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expanded view for a request
  const toggleExpandRequest = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  // Handle status update
  const handleUpdateStatus = async (requestId, status) => {
    // Encontrar la solicitud para crear la actividad
    const request = requests.find(r => r.id === requestId);
    
    try {
      setLoading(true);
      const response = await updateMaterialRequestStatus(requestId, status, "");
      console.log(`Solicitud ${requestId} actualizada a "${status}"`, response);
      
      // Crear actividad en la base de datos
      if (request) {
        const statusTranslations = {
          'approved': 'aprobó',
          'rejected': 'rechazó',
          'resolved': 'resolvió'
        };
        
        const actionText = statusTranslations[status] || 'actualizó';
        const userName = localStorage.getItem('username') || 'Supervisor';
        
        // Crear actividad en la base de datos (no bloquea si falla)
        createActivity({
          title: "Solicitud Actualizada",
          description: `${userName} ${actionText} la solicitud de ${request.quantity_requested} unidades de ${request.material} de ${request.user?.username || 'un empleado'}`,
          type: "request_status_update",
          status: status,
          requestId: requestId
        }).catch(error => {
          console.warn("No se pudo crear la actividad en la BD, pero el proceso continuó:", error);
        });

        // También crear actividad local inmediata para feedback visual
        if (onActivityAdd) {
          onActivityAdd({
            title: "Solicitud Actualizada", 
            description: `${userName} ${actionText} la solicitud de ${request.quantity_requested} unidades de ${request.material} de ${request.user?.username || 'un empleado'}`,
            type: "request_status_update",
            status: status,
            requestId: requestId
          });
        }
      }
      
      // Refresh the list
      await loadRequests();
      
      // Notify parent component if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error(`Error al actualizar estado de solicitud a "${status}":`, error);
      
      // En caso de error, también crear una actividad de error
      if (request) {
        const userName = localStorage.getItem('username') || 'Supervisor';
        
        // Crear actividad de error en la base de datos
        createActivity({
          title: "Error en Solicitud",
          description: `${userName} intentó actualizar la solicitud de ${request.material} pero ocurrió un error`,
          type: "request_error", 
          status: "error",
          requestId: requestId
        }).catch(err => {
          console.warn("No se pudo crear la actividad de error en la BD:", err);
        });

        // También crear actividad local para feedback visual
        if (onActivityAdd) {
          onActivityAdd({
            title: "Error en Solicitud",
            description: `${userName} intentó actualizar la solicitud de ${request.material} pero ocurrió un error`,
            type: "request_error",
            status: "error", 
            requestId: requestId
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500 text-black",
      approved: "bg-green-500 text-black",
      rejected: "bg-red-500 text-black",
      resolved: "bg-blue-500 text-black"
    };
    
    return styles[status] || "bg-gray-500 text-black";
  };

  // Format date with multiple fallbacks
  const formatDate = (request) => {
    if (!request) {
      console.warn("No request object provided to formatDate");
      return "Sin fecha";
    }
    
    // Try different date field names that might be returned by the API
    const possibleDateFields = [
      { name: 'created_at', value: request.created_at },
      { name: 'createdAt', value: request.createdAt },
      { name: 'date_created', value: request.date_created },
      { name: 'dateCreated', value: request.dateCreated },
      { name: 'fecha_creacion', value: request.fecha_creacion },
      { name: 'timestamp', value: request.timestamp },
      { name: 'fecha', value: request.fecha },
      { name: 'updatedAt', value: request.updatedAt },
      { name: 'updated_at', value: request.updated_at }
    ];
    
         // Debug only in development
     if (import.meta.env.DEV) {
       console.log(`Intentando formatear fecha para request ID ${request.id}:`, possibleDateFields);
     }
    
    // Find the first valid date
    for (const dateField of possibleDateFields) {
      if (dateField.value) {
        try {
          const date = new Date(dateField.value);
          // Check if the date is valid
          if (!isNaN(date.getTime())) {
                         if (import.meta.env.DEV) {
               console.log(`Fecha válida encontrada en campo '${dateField.name}':`, dateField.value);
             }
            return date.toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        } catch (error) {
          console.warn(`Error parsing date from field '${dateField.name}':`, dateField.value, error);
        }
      }
    }
    
         // If no valid date found, show a helpful message
     console.warn("No se encontró una fecha válida en el request:", request);
     return "Sin fecha registrada";
  };

  // Traducir status para mostrar en español
  const translateStatus = (status) => {
    const translations = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      resolved: 'Resuelto'
    };
    
    return translations[status] || status;
  };
  
  // Verificar si requests es un array válido antes de renderizar
  const hasRequests = Array.isArray(requests) && requests.length > 0;

  return (
    <Card className="bg-slate-800 border-slate-700 shadow-md">
      <CardHeader className="bg-slate-900 border-b border-slate-700">
        <CardTitle className="text-lg font-bold text-white">Solicitudes de Materiales</CardTitle>
        <CardDescription className="text-slate-400">
          Solicitudes pendientes de aprobación
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-700">
          {loading ? (
            <div className="p-4 text-center text-slate-300">Cargando solicitudes...</div>
          ) : !hasRequests ? (
            <div className="p-4 text-center text-slate-300">No hay solicitudes pendientes</div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-slate-700/50 text-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-orange-400">
                      {request.user?.username || `Usuario #${request.user_id}`}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {formatDate(request)}
                      {request._hasGeneratedDate && (
                        <span className="ml-1 text-xs text-amber-400" title="Fecha estimada">
                          (est.)
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge className={getStatusBadge(request.status)}>
                    {translateStatus(request.status)}
                  </Badge>
                </div>

                <p className="text-sm mb-2 text-slate-300">
                  <strong className="text-white">Zona:</strong> {request.zone_name || `Zona #${request.zone_id}`}
                </p>
                
                <p className="text-sm mb-2 text-slate-300">
                  <strong className="text-white">Material:</strong> {request.material}
                </p>
                
                <p className="text-sm mb-2 text-slate-300">
                  <strong className="text-white">Cantidad solicitada:</strong> {request.quantity_requested} unidades
                </p>
                
                {request.user_name && (
                  <p className="text-sm mb-2 text-slate-300">
                    <strong className="text-white">Empleado:</strong> {request.user_name}
                  </p>
                )}
                
                <div className="mb-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-300 hover:text-white hover:bg-slate-700"
                    onClick={() => toggleExpandRequest(request.id)}
                  >
                    {expandedRequest === request.id ? "Ocultar detalles" : "Ver detalles"}
                  </Button>
                </div>

                {expandedRequest === request.id && (
                  <div className="mt-3 p-3 bg-slate-700 rounded-md">
                    <p className="text-sm mb-4 text-slate-300">
                      <strong className="text-white">Mensaje:</strong><br />
                      {request.message || "Sin mensaje adicional"}
                    </p>
                    
                    {request.status === 'pending' && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="bg-red-900/30 hover:bg-red-800 text-red-300 border-red-800"
                          onClick={() => handleUpdateStatus(request.id, 'rejected')}
                          disabled={loading}
                        >
                          Rechazar
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="bg-blue-900/30 hover:bg-blue-800 text-blue-300 border-blue-800"
                          onClick={() => handleUpdateStatus(request.id, 'resolved')}
                          disabled={loading}
                        >
                          Resolver
                        </Button>
                        
                        <Button
                          className="bg-green-800 hover:bg-green-700 text-white"
                          onClick={() => handleUpdateStatus(request.id, 'approved')}
                          disabled={loading}
                        >
                          Aprobar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-slate-900 border-t border-slate-700 flex justify-between p-4">
        <Button 
          variant="outline" 
          onClick={loadRequests}
          disabled={loading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          Actualizar
        </Button>
      </CardFooter>
    </Card>
  );
}

MaterialRequestsCard.propTypes = {
  onRefresh: PropTypes.func,
  onActivityAdd: PropTypes.func
};

export default MaterialRequestsCard; 