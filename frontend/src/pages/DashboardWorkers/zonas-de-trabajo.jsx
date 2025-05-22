import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchWorkZones, fetchZoneMaterials } from "@/services/dashboardService";
import { Loader2, Package, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";

function ZonasDeTrabajo({ onSelectZone }) {
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneMaterials, setZoneMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialError, setMaterialError] = useState(null);
  const [showMaterialsDialog, setShowMaterialsDialog] = useState(false);

  useEffect(() => {
    const fetchZonas = async () => {
      setLoading(true);
      try {
        const response = await fetchWorkZones();
        console.log("Respuesta de zonas en ZonasDeTrabajo:", response);

        let zonasData = [];
        if (response && response.data) {
          // Extraer el array de zonas
          if (Array.isArray(response.data)) {
            zonasData = response.data;
          } else if (typeof response.data === 'object') {
            // Buscar el array en alguna propiedad
            for (const key in response.data) {
              if (Array.isArray(response.data[key])) {
                zonasData = response.data[key];
                break;
              }
            }
          }

          // Transformar los datos
          const zonasTransformadas = zonasData.map(zona => ({
            id: zona.id || '0',
            nombre: zona.name || zona.nombre || 'Zona sin nombre',
            descripcion: zona.description || zona.descripcion || 'Sin descripción',
            estado: zona.estado || zona.status || 'No definido',
            radio: zona.radius || zona.radio || 500
          }));

          setZonas(zonasTransformadas);
        }
      } catch (err) {
        console.error("Error al cargar zonas:", err);
        setError("No se pudieron cargar las zonas de trabajo");
      } finally {
        setLoading(false);
      }
    };

    fetchZonas();
  }, []);

  const handleVerDetalles = async (zona) => {
    setSelectedZone(zona);
    setShowMaterialsDialog(true);
    
    try {
      setLoadingMaterials(true);
      setMaterialError(null);
      
      console.log(`Cargando materiales para zona ${zona.id}...`);
      const response = await fetchZoneMaterials(zona.id);
      
      let materialsData = null;
      // Intentamos acceder a los datos de diferentes maneras según la estructura de respuesta
      if (response && response.data) {
        // Caso 1: response.data es directamente el array de materiales
        if (Array.isArray(response.data)) {
          materialsData = response.data;
        } 
        // Caso 2: Los materiales están anidados en una propiedad de response.data
        else if (typeof response.data === 'object') {
          // Revisar las propiedades más comunes donde podrían estar los materiales
          const possiblePaths = ['materials', 'items', 'results', 'data', 'zoneMaterials', 'zonaMateriales', 'materiales'];
          
          for (const path of possiblePaths) {
            if (response.data[path] && Array.isArray(response.data[path])) {
              materialsData = response.data[path];
              break;
            }
          }
          
          // Si no encontramos en las rutas comunes, intentamos encontrar cualquier array
          if (!materialsData) {
            for (const key in response.data) {
              if (Array.isArray(response.data[key])) {
                materialsData = response.data[key];
                break;
              }
            }
          }
        }
      }
      
      // Si no pudimos encontrar los datos de ninguna manera, establecemos un array vacío
      if (!materialsData) {
        console.warn("No se encontraron materiales para esta zona");
        materialsData = [];
      }
      
      // Transformar los datos para asegurar que tengan la estructura correcta
      const transformedMaterials = materialsData.map(material => {
        // Buscar propiedades anidadas
        let nestedMaterial = null;
        if (material.material && typeof material.material === 'object') {
          nestedMaterial = material.material;
        }
        
        // Extraer cantidad y unidad, asegurándose de que sean valores válidos
        const rawQuantity = material.cantidad_disponible || material.cantidad || material.quantity || 
                           nestedMaterial?.quantity || nestedMaterial?.cantidad_disponible || 
                           nestedMaterial?.cantidad || 0;
        
        // Convertir la cantidad a número
        const quantity = typeof rawQuantity === 'string' ? parseFloat(rawQuantity) : rawQuantity;
        
        // Extraer unidad, con valor predeterminado
        const unit = material.unidad || material.unit || nestedMaterial?.unit || 
                    nestedMaterial?.unidad || 'unidades';
        
        console.log(`Material procesado: ${material.name || nestedMaterial?.name || 'desconocido'}, cantidad: ${quantity}, unidad: ${unit}`);
        
        return {
          id: material.id || material.id_material || nestedMaterial?.id || '0',
          name: material.nombre || material.name || nestedMaterial?.name || nestedMaterial?.nombre || 'Material sin nombre',
          quantity: quantity,
          unit: unit,
          description: material.descripcion || material.description || nestedMaterial?.description || '',
        };
      });
      
      console.log("Materiales transformados:", transformedMaterials);
      setZoneMaterials(transformedMaterials);
      
    } catch (err) {
      console.error("Error al cargar materiales de la zona:", err);
      setMaterialError("No se pudieron cargar los materiales de esta zona");
    } finally {
      setLoadingMaterials(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin mr-2" size={24} />
        <span>Cargando zonas de trabajo...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>{error}</p>
      </div>
    );
  }

  if (zonas.length === 0) {
    return (
      <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
        <p>No hay zonas de trabajo disponibles</p>
      </div>
    );
  }

  return (
    <>
      <motion.section 
        id="zonas-de-trabajo"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring",
            damping: 25,
            stiffness: 300
          }
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-slate-500" />
          </div>
        ) : zonas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zonas.map((zona) => (
              <motion.div
                key={zona.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: {
                    delay: 0.1,
                    duration: 0.3
                  }
                }}
              >
                <Card className="bg-slate-800/80 border-slate-700/50 hover:border-slate-500/30 transition-colors shadow-lg">
                  <CardHeader className="bg-slate-900/50 border-b border-slate-700/50">
                    <CardTitle className="text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      {zona.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-slate-300">{zona.descripcion}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/50 p-2 rounded-md border border-slate-700/50">
                        <p className="text-sm text-slate-400">Estado</p>
                        <p className="text-sm font-medium text-white">{zona.estado}</p>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded-md border border-slate-700/50">
                        <p className="text-sm text-slate-400">Radio</p>
                        <p className="text-sm font-medium text-white">{zona.radio}m</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleVerDetalles(zona)}
                        variant="outline"
                        className="flex-1 bg-slate-900/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Package size={16} className="mr-2 text-orange-500" /> {/* Added text-orange-500 here */}
                        Ver detalles
                      </Button>
                      <Button
                        onClick={() => onSelectZone(zona.nombre)}
                        className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                      >
                        Seleccionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/80 p-8 rounded-lg border border-slate-700/50 text-center"
          >
            <p className="text-slate-400">No hay zonas de trabajo disponibles.</p>
          </motion.div>
        )}
      </motion.section>

      {/* Modal para mostrar los materiales de la zona */}
      <Dialog open={showMaterialsDialog} onOpenChange={setShowMaterialsDialog}>
        <DialogContent className="sm:max-w-[600px] bg-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Materiales en {selectedZone?.nombre}</DialogTitle>
            <DialogDescription className="text-slate-300">
              Listado de materiales asignados a esta zona de trabajo
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {loadingMaterials ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin mr-2" size={24} />
                <span className="text-slate-300">Cargando materiales...</span>
              </div>
            ) : materialError ? (
              <div className="p-4 bg-red-900/30 border border-red-800 rounded-md text-red-300">
                <p>{materialError}</p>
              </div>
            ) : zoneMaterials.length === 0 ? (
              <div className="p-4 bg-slate-700/30 border border-slate-700 rounded-md text-slate-300 text-center">
                <p>No hay materiales asignados a esta zona</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {zoneMaterials.map((material) => (
                    <div 
                      key={material.id} 
                      className="p-3 bg-slate-700 rounded-md border border-slate-600"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-white">{material.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white bg-orange-500 px-3 py-1 rounded">
                            {material.quantity}
                          </span>
                          <span className="text-sm text-white bg-slate-600 px-2 py-1 rounded">
                            {material.unit}
                          </span>
                        </div>
                      </div>
                      {material.description && (
                        <p className="text-sm text-slate-300 mt-1">{material.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowMaterialsDialog(false)} 
              className="bg-orange-500 hover:bg-orange-600"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ZonasDeTrabajo;