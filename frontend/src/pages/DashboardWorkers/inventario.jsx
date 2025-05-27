import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth";
import { InventoryCard } from "@/components/ui/InventoryCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MaterialRequestForm } from "@/components/ui/MaterialRequestForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchMaterials, fetchWorkZones, createMaterialRequest } from "@/services/dashboardService";
import { motion } from "framer-motion";

export default function Inventario() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);

  // Cargar materiales y zonas
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Cargar materiales desde la API
        const materialsResponse = await fetchMaterials();
        console.log("Respuesta de materiales:", materialsResponse);

        // Cargar zonas desde la API
        const zonesResponse = await fetchWorkZones();
        console.log("Respuesta de zonas:", zonesResponse);

        // Procesar materiales
        const processedMaterials = [];
        if (materialsResponse && materialsResponse.data) {
          let materialsData = null;
          
          // Caso 1: response.data es directamente el array de materiales
          if (Array.isArray(materialsResponse.data)) {
            materialsData = materialsResponse.data;
          } 
          // Caso 2: Los materiales están anidados en una propiedad de response.data
          else if (typeof materialsResponse.data === 'object') {
            // Revisar propiedades comunes
            const possiblePaths = ['materials', 'items', 'results', 'data'];
            
            for (const path of possiblePaths) {
              if (materialsResponse.data[path] && Array.isArray(materialsResponse.data[path])) {
                materialsData = materialsResponse.data[path];
                break;
              }
            }
            
            // Si no encontramos en las rutas comunes, intentamos encontrar cualquier array
            if (!materialsData) {
              for (const key in materialsResponse.data) {
                if (Array.isArray(materialsResponse.data[key])) {
                  materialsData = materialsResponse.data[key];
                  break;
                }
              }
            }
          }
          
          // Transformar los datos para asegurar que tengan la estructura correcta
          if (Array.isArray(materialsData)) {
            processedMaterials.push(...materialsData.map(material => {
              // Buscar propiedades anidadas
              let nestedMaterial = null;
              if (material.material && typeof material.material === 'object') {
                nestedMaterial = material.material;
              }
              
              return {
                id: material.id || material.id_material || nestedMaterial?.id || '0',
                name: material.name || material.nombre || nestedMaterial?.name || nestedMaterial?.nombre || 'Material sin nombre',
                description: material.description || material.descripcion || nestedMaterial?.description || nestedMaterial?.descripcion || 'Sin descripción',
                quantity: material.quantity || material.cantidad || material.cantidad_disponible || nestedMaterial?.quantity || nestedMaterial?.cantidad || 0,
                unit: material.unit || material.unidad || nestedMaterial?.unit || nestedMaterial?.unidad || 'unidades',
                image: material.image || material.image_url || material.imagen || nestedMaterial?.image || nestedMaterial?.image_url || 'https://i.imgur.com/XoTNlNN.jpg'
              };
            }));
          }
        }
        
        // Procesar zonas
        const processedZones = [];
        if (zonesResponse && zonesResponse.data) {
          let zonesData = null;
          
          if (Array.isArray(zonesResponse.data)) {
            zonesData = zonesResponse.data;
          } else if (typeof zonesResponse.data === 'object') {
            // Buscar array de zonas en respuesta
            for (const key in zonesResponse.data) {
              if (Array.isArray(zonesResponse.data[key])) {
                zonesData = zonesResponse.data[key];
                break;
              }
            }
          }
          
          if (Array.isArray(zonesData)) {
            processedZones.push(...zonesData.map(zone => ({
              id: zone.id || '0',
              name: zone.name || zone.nombre || 'Zona sin nombre'
            })));
          }
        }
        
        console.log("Materiales procesados:", processedMaterials);
        console.log("Zonas procesadas:", processedZones);
        
        setMaterials(processedMaterials);
        setZones(processedZones);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("No se pudieron cargar los datos. Intente de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredMaterials = materials.filter(material => 
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar solicitud directamente desde el card (nueva funcionalidad)
  const handleCardRequest = async (formData) => {
    try {
      console.log("Solicitud enviada desde card:", formData);
      
      // Validar que tengamos un usuario válido
      if (!user?.id) {
        throw new Error("Usuario no identificado. Por favor, inicia sesión nuevamente.");
      }
      
      // Preparar los datos para la API
      const requestData = {
        user_id: user.id,
        zone_id: formData.zoneId,
        material: formData.materialName,
        quantity_requested: formData.quantity,
        message: formData.notes || ""
      };
      
      console.log("Enviando datos a la API:", requestData);
      
      // Enviar la solicitud usando el servicio real
      const response = await createMaterialRequest(requestData);
      
      console.log("Respuesta de la API:", response);
      
      // Mostrar mensaje de éxito
      setRequestSuccess(`Solicitud enviada correctamente para ${formData.materialName} - Cantidad: ${formData.quantity} ${materials.find(m => m.id === formData.materialId)?.unit || 'unidades'} - Zona: ${formData.zoneName}`);
      
      // Limpiar mensaje después de unos segundos
      setTimeout(() => {
        setRequestSuccess(null);
      }, 5000);
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
      let errorMessage = "No se pudo enviar la solicitud. ";
      
      // Manejar errores específicos de la API
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage += err.response.data;
        } else if (err.response.data.message) {
          errorMessage += err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage += err.response.data.error;
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Intente de nuevo más tarde.";
      }
      
      setError(errorMessage);
      throw err; // Re-lanzar el error para que el componente lo maneje
    }
  };

  // Mantener la funcionalidad anterior para compatibilidad
  const handleRequestMaterial = (material) => {
    setSelectedMaterial(material);
    setIsDialogOpen(true);
  };

  const handleSubmitRequest = async (formData) => {
    setIsRequestSubmitting(true);
    
    try {
      // Aquí normalmente enviaríamos a la API
      // await fetch('api/material-requests', { 
      //   method: 'POST', 
      //   body: JSON.stringify(formData)
      // });
      
      // Simulando envío con retraso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mostrar mensaje de éxito
      setRequestSuccess(`Solicitud enviada correctamente para ${formData.materialName}`);
      setIsDialogOpen(false);
      
      // Limpiar mensaje después de unos segundos
      setTimeout(() => {
        setRequestSuccess(null);
      }, 5000);
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
      setError("No se pudo enviar la solicitud. Intente de nuevo más tarde.");
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        
        <div className="w-full md:w-64 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <Input
            type="text"
            placeholder="Buscar materiales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {requestSuccess && (
        <Alert className="mb-6 border-green-500 bg-green-500/20">
          <AlertDescription className="text-green-400">{requestSuccess}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all">
        <TabsList className="bg-slate-800/50 mb-6">
          <TabsTrigger value="all">Todos los Materiales</TabsTrigger>
          <TabsTrigger value="available">Disponibles</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredMaterials.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                {filteredMaterials.map((material, index) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: {
                        delay: index * 0.1,
                        duration: 0.3,
                        type: "spring",
                        damping: 25,
                        stiffness: 300
                      }
                    }}
                  >
                    <InventoryCard 
                      {...material} 
                      showRequestButton={true}
                      onRequestMaterial={handleCardRequest}
                    />
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-slate-300">No se encontraron materiales</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                {filteredMaterials
                  .filter(material => material.quantity > 0)
                  .map((material, index) => (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        transition: {
                          delay: index * 0.1,
                          duration: 0.3,
                          type: "spring",
                          damping: 25,
                          stiffness: 300
                        }
                      }}
                    >
                      <InventoryCard 
                        {...material} 
                        showRequestButton={true}
                        onRequestMaterial={handleCardRequest}
                      />
                    </motion.div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal para solicitar material */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white">
          <MaterialRequestForm 
            onSubmit={handleSubmitRequest}
            materials={[selectedMaterial].filter(Boolean)}
            zones={zones}
            isLoading={isRequestSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}