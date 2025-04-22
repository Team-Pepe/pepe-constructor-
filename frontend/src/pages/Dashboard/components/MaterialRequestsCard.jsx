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
import { Textarea } from "@/components/ui/textarea";
import { fetchMaterialRequests, updateMaterialRequestStatus } from "@/services/dashboardService";

export function MaterialRequestsCard({ onRefresh }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminComment, setAdminComment] = useState({});
  const [expandedRequest, setExpandedRequest] = useState(null);

  // Load material requests when component mounts
  useEffect(() => {
    loadRequests();
  }, []);

  // Function to load material requests from backend
  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetchMaterialRequests("pending");
      setRequests(response.data || []);
    } catch (error) {
      console.error("Error al cargar solicitudes de materiales:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle admin comment change
  const handleCommentChange = (requestId, value) => {
    setAdminComment({
      ...adminComment,
      [requestId]: value
    });
  };

  // Toggle expanded view for a request
  const toggleExpandRequest = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  // Handle approving or rejecting a request
  const handleUpdateStatus = async (requestId, status) => {
    try {
      setLoading(true);
      await updateMaterialRequestStatus(
        requestId,
        status,
        adminComment[requestId] || ""
      );
      
      // Refresh the list
      await loadRequests();
      
      // Clear the comment for this request
      const newAdminComment = { ...adminComment };
      delete newAdminComment[requestId];
      setAdminComment(newAdminComment);
      
      // Notify parent component if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error(`Error al ${status === 'approved' ? 'aprobar' : 'rechazar'} solicitud:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500 hover:bg-yellow-600",
      approved: "bg-green-500 hover:bg-green-600",
      rejected: "bg-red-500 hover:bg-red-600",
      completed: "bg-blue-500 hover:bg-blue-600"
    };
    
    return styles[status] || "bg-gray-500 hover:bg-gray-600";
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

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-slate-100">
        <CardTitle className="text-lg font-bold">Solicitudes de Materiales</CardTitle>
        <CardDescription>
          Solicitudes pendientes de aprobación
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {loading ? (
            <div className="p-4 text-center">Cargando solicitudes...</div>
          ) : requests.length === 0 ? (
            <div className="p-4 text-center">No hay solicitudes pendientes</div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">
                      {request.user_name || `Usuario #${request.user_id}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                  <Badge className={getStatusBadge(request.status)}>
                    {request.status === 'pending' ? 'Pendiente' : 
                     request.status === 'approved' ? 'Aprobado' : 
                     request.status === 'rejected' ? 'Rechazado' : 
                     request.status === 'completed' ? 'Completado' : 
                     request.status}
                  </Badge>
                </div>

                <p className="text-sm mb-2">
                  <strong>Zona:</strong> {request.zone_name || `Zona #${request.zone_id}`}
                </p>
                
                {request.material_id && (
                  <p className="text-sm mb-2">
                    <strong>Material:</strong> {request.material_name || `Material #${request.material_id}`}
                  </p>
                )}
                
                <p className="text-sm mb-2">
                  <strong>Cantidad:</strong> {request.quantity_requested}
                </p>
                
                <div className="mb-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleExpandRequest(request.id)}
                  >
                    {expandedRequest === request.id ? "Ocultar detalles" : "Ver detalles"}
                  </Button>
                </div>

                {expandedRequest === request.id && (
                  <div className="mt-3 p-3 bg-slate-100 rounded-md">
                    <p className="text-sm mb-3">
                      <strong>Mensaje:</strong><br />
                      {request.message || "Sin mensaje adicional"}
                    </p>
                    
                    {request.status === 'pending' && (
                      <>
                        <div className="mb-3">
                          <Textarea
                            placeholder="Comentario para el trabajador..."
                            value={adminComment[request.id] || ""}
                            onChange={(e) => handleCommentChange(request.id, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            className="bg-red-100 hover:bg-red-200 text-red-800 border-red-300"
                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                            disabled={loading}
                          >
                            Rechazar
                          </Button>
                          
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                            disabled={loading}
                          >
                            Aprobar
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 flex justify-between">
        <Button 
          variant="outline" 
          onClick={loadRequests}
          disabled={loading}
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