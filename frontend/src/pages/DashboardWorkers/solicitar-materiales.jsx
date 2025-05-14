import React, { useState, useEffect } from "react";
import { MaterialRequestForm } from "@/components/ui/MaterialRequestForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWorkZones, fetchMaterials, createMaterialRequest } from "@/services/dashboardService";
import { getCookie } from "@/utils/cookies";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";

function SolicitarMateriales() {
  const [zones, setZones] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  // Usar el hook useAuth para obtener el rol directamente del contexto
  const { roleId, user } = useAuth();
  
  // Obtener el userId de cookies o localStorage como respaldo
  const userId = user?.id || getCookie('userId') || localStorage.getItem('userId');
  
  // Verificar si el usuario puede solicitar materiales (roleId 3)
  // Convertimos el roleId a número para asegurar consistencia en la comparación
  const userRoleId = Number(roleId);
  const canRequestMaterials = userRoleId === 3;
  
  useEffect(() => {
    console.log("Rol del usuario en solicitar-materiales:", userRoleId, "- Puede solicitar:", canRequestMaterials);
    
    // Si el usuario no tiene roleId 3, mostrar mensaje y preparar redirección
    if (!canRequestMaterials) {
      setError("No tienes permiso para solicitar materiales. Esta función es solo para trabajadores con rol específico.");
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar zonas de trabajo y materiales
        const [zonesResponse, materialsResponse] = await Promise.all([
          fetchWorkZones(),
          fetchMaterials()
        ]);
        
        setZones(zonesResponse.data || []);
        setMaterials(materialsResponse.data || []);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar zonas de trabajo y materiales. Por favor, intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userRoleId, canRequestMaterials]);
  
  const handleSubmitRequest = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // Verificar permisos nuevamente (por seguridad)
      if (!canRequestMaterials) {
        setError("No tienes permiso para realizar esta acción.");
        return;
      }
      
      // Validar que tengamos un userId
      if (!userId) {
        setError("No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.");
        return;
      }
      
      // Validation checks
      if (!formData.material.trim()) {
        setError("El nombre del material es requerido.");
        return;
      }
      
      if (!formData.zoneId) {
        setError("La zona de trabajo es requerida.");
        return;
      }
      
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        setError("La cantidad debe ser mayor a cero.");
        return;
      }
      
      // Preparar los datos para la solicitud
      const requestData = {
        user_id: userId,
        zone_id: formData.zoneId,
        material: formData.material,
        quantity_requested: formData.quantity,
        message: formData.notes || ""
      };
      
      console.log("Enviando solicitud de materiales:", requestData);
      
      // Enviar la solicitud al backend
      const response = await createMaterialRequest(requestData);
      
      console.log("Respuesta del servidor:", response);
      
      // Mostrar mensaje de éxito
      setSuccess(true);
      
      // Después de 3 segundos, redirigir al dashboard
      setTimeout(() => {
        navigate('/dashboard-empleados');
      }, 3000);
      
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
      let errorMessage = "Error al enviar la solicitud de materiales. ";
      
      // Check for specific API errors
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage += err.response.data;
        } else if (err.response.data.message) {
          errorMessage += err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage += err.response.data.error;
        }
      } else {
        errorMessage += "Por favor, intenta nuevamente.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect logic for non-authorized users
  const handleRedirect = () => {
    navigate('/dashboard-empleados');
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Solicitar Materiales</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
          {!canRequestMaterials && (
            <Button 
              onClick={handleRedirect} 
              className="mt-4 w-full"
            >
              Volver al Dashboard
            </Button>
          )}
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-100 border-green-500 text-green-900">
          <AlertDescription>
            Solicitud enviada correctamente. Serás redirigido al dashboard en unos segundos...
          </AlertDescription>
        </Alert>
      )}
      
      {canRequestMaterials && (
        <MaterialRequestForm 
          onSubmit={handleSubmitRequest}
          materials={materials}
          zones={zones}
          isLoading={loading}
        />
      )}
    </div>
  );
}

export default SolicitarMateriales;