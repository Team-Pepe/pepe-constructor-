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
import { fetchMaterialRequests, updateMaterialRequestStatus } from "@/services/dashboardService";

export function MaterialRequestsCard({ onRefresh }) {
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
        setRequests(response.data || []);
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
    try {
      setLoading(true);
      const response = await updateMaterialRequestStatus(requestId, status, "");
      console.log(`Solicitud ${requestId} actualizada a "${status}"`, response);
      
      // Refresh the list
      await loadRequests();
      
      // Notify parent component if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error(`Error al actualizar estado de solicitud a "${status}":`, error);
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha desconocida";
    
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                  <Badge className={getStatusBadge(request.status)}>
                    {translateStatus(request.status)}
                  </Badge>
                </div>

                <p className="text-sm mb-2 text-slate-300">
                  <strong className="text-white">Zona:</strong> {`Zona #${request.zone_id}`}
                </p>
                
                <p className="text-sm mb-2 text-slate-300">
                  <strong className="text-white">Material:</strong> {request.material}
                </p>
                
                <p className="text-sm mb-2 text-slate-300">
                  <strong className="text-white">Cantidad:</strong> {request.quantity_requested}
                </p>
                
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
  onRefresh: PropTypes.func
};

export default MaterialRequestsCard; 