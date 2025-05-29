import React, { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryCard } from "@/components/ui/InventoryCard";
import { InventoryForm } from "@/components/ui/InventoryForm";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getImageUrl } from "@/services/supabaseService";
import { fetchMaterials, createMaterial, updateMaterial, deleteMaterial, fetchWorkZones, fetchZoneMaterials, assignMaterialsToZone } from "@/services/dashboardService";
import { MaterialAssignmentModal } from "@/components/ui/WorkZoneMap/MaterialAssignmentModal";
import { ViewMaterialsModal } from "@/components/ui/WorkZoneMap/ViewMaterialsModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";


export default function Inventory() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [successMessage, setSuccessMessage] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [zoneMaterials, setZoneMaterials] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [assignSuccess, setAssignSuccess] = useState(null);

  // Cargar materiales
  useEffect(() => {
    const loadMaterials = async () => {
      setIsLoading(true);
      try {
        const response = await fetchMaterials();
        console.log('Materiales recibidos:', response.data);
        const materialsWithImages = response.data.map(material => {
          // Construir la URL completa de la imagen usando el servicio de Supabase
          const fullImageUrl = material.image_url ? getImageUrl(material.image_url) : null;
          
          return {
            ...material,
            image: fullImageUrl,
            unit: "kg"
          };
        });
        
        setMaterials(materialsWithImages);
      } catch (err) {
        console.error("Error al cargar materiales:", err);
        setError("No se pudieron cargar los materiales");
      } finally {
        setIsLoading(false);
      }
    };

    loadMaterials();
  }, []);

  // Cargar zonas de trabajo al montar
  useEffect(() => {
    const loadZones = async () => {
      setLoadingZones(true);
      try {
        const response = await fetchWorkZones();
        setZones(response.data || []);
      } catch {
        setZones([]);
      } finally {
        setLoadingZones(false);
      }
    };
    loadZones();
  }, []);

  const handleAddMaterial = async (formData) => {
    setIsLoading(true);
    try {
      console.log('Enviando material:', Object.fromEntries(formData.entries()));
      
      const response = await createMaterial(formData);
      
      console.log('Respuesta del servidor:', response.data);
      
      const savedMaterial = {
        ...response.data,
        image: response.data.image_url,
        unit: "kg"
      };
      
      setMaterials(prev => [...prev, savedMaterial]);
      setIsDialogOpen(false);
      setSuccessMessage("Material agregado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error al añadir material:", err);
      setError(`No se pudo guardar el material: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMaterial = async (formData) => {
    setIsLoading(true);
    try {
      // Extraer el ID del formData
      const materialId = formData.get('id');
      
      // Crear un objeto JSON plano para enviar al backend
      const materialData = {
        name: formData.get('name'),
        description: formData.get('description') || '',
        quantity: parseFloat(formData.get('quantity')),
        image_url: formData.get('image_url')
      };
      
      // Filtrar cualquier valor undefined o null
      Object.keys(materialData).forEach(key => 
        (materialData[key] === undefined || materialData[key] === null) && delete materialData[key]
      );
      
      console.log('Editando material ID:', materialId, 'con datos JSON:', materialData);
      
      // Llamar a la API con el ID como parámetro y los datos JSON en el cuerpo
      const response = await updateMaterial(materialId, materialData);
      
      const updatedData = response.data;
      console.log('Respuesta del servidor:', updatedData);
      
      if (!updatedData) {
        throw new Error('No se recibieron datos actualizados del servidor');
      }
      
      const updatedMaterials = materials.map(mat => 
        mat.id === parseInt(materialId)
          ? { 
              ...updatedData,
              image: updatedData.image_url || mat.image,
              unit: updatedData.unit || mat.unit || "kg"
            } 
          : mat
      );
      
      setMaterials(updatedMaterials);
      setEditingMaterial(null);
      setIsDialogOpen(false);
      setSuccessMessage("Material actualizado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error al editar material:", err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(`No se pudo actualizar el material: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm("¿Está seguro de que desea eliminar este material?")) {
      setIsLoading(true);
      try {
        await deleteMaterial(id);
        setMaterials(prev => prev.filter(mat => mat.id !== id));
        setSuccessMessage("Material eliminado con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error("Error al eliminar material:", err);
        setError(`No se pudo eliminar el material: ${err.response?.data?.message || err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openEditDialog = (material) => {
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  // Filtrar materiales si es necesario según la pestaña activa
  const filteredMaterials = activeTab === "low" 
    ? materials.filter(mat => mat.quantity < 200)
    : materials;

  // Función para abrir modal de ver materiales
  const handleViewMaterials = async (zone) => {
    setSelectedZone(zone);
    setShowViewModal(true);
    try {
      const response = await fetchZoneMaterials(zone.id);
      // Normalizar estructura de materiales
      let materials = [];
      if (Array.isArray(response.data)) {
        materials = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Buscar array en propiedades comunes
        const keys = Object.keys(response.data);
        for (const k of keys) {
          if (Array.isArray(response.data[k])) {
            materials = response.data[k];
            break;
          }
        }
      }
      // Normalizar formato
      const normalized = materials.map(mat => ({
        id: mat.id || mat.id_material || mat.material_id || (mat.material && mat.material.id) || '0',
        name: mat.name || mat.nombre || (mat.material && (mat.material.name || mat.material.nombre)) || 'Material',
        quantity: mat.quantity || mat.cantidad || mat.cantidad_disponible || mat.cantidad_asignada || (mat.material && mat.material.quantity) || 0,
        unit: mat.unit || mat.unidad || (mat.material && mat.material.unit) || 'unidades',
      }));
      setZoneMaterials(normalized);
    } catch {
      setZoneMaterials([]);
    }
  };

  // Función para abrir modal de asignar materiales
  const handleAssignMaterials = (zone) => {
    setSelectedZone(zone);
    setShowAssignModal(true);
    setAssignSuccess(null);
  };

  // NUEVO: función para manejar asignación y feedback
  const handleAssignToZone = async ({ materialId, quantity, zoneId }) => {
    setAssignSuccess(null);
    try {
      await assignMaterialsToZone({
        zoneId: parseInt(zoneId),
        materialId: parseInt(materialId),
        quantity: parseInt(quantity)
      });
      setAssignSuccess('Material asignado correctamente a la zona');
      setShowAssignModal(false);
      // Recargar materiales de la zona si el modal de ver está abierto
      if (showViewModal && selectedZone) {
        await handleViewMaterials(selectedZone);
      }
    } catch {
      setAssignSuccess('Error al asignar material');
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={16} />
              <span>Agregar Material</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Material</DialogTitle>
              <DialogDescription>
                Complete el formulario para agregar un nuevo material al inventario.
              </DialogDescription>
            </DialogHeader>
            <InventoryForm 
              onSubmit={editingMaterial ? handleEditMaterial : handleAddMaterial} 
              initialData={editingMaterial}
              isEditing={!!editingMaterial}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="mb-6 border-green-500 bg-green-500/20">
          <AlertDescription className="text-green-400">{successMessage}</AlertDescription>
        </Alert>
      )}
      {assignSuccess && (
        <Alert className="mb-6 border-green-500 bg-green-500/20">
          <AlertDescription className="text-green-400">{assignSuccess}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="low">Stock Bajo</TabsTrigger>
          <TabsTrigger value="zones">Por Zona</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
              }
            }}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : materials.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
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
                          duration: 0.3
                        }
                      }}
                      className="relative group"
                    >
                      <InventoryCard {...material} />
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(material)}
                          className="bg-slate-800/80 border-orange-500 text-orange-500 hover:bg-orange-500/20 hover:text-orange-400"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="bg-slate-800/80 border-red-500 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-slate-300 mb-4">No hay materiales en el inventario</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  Agregar el Primer Material
                </Button>
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="low" className="mt-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
              }
            }}
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : filteredMaterials.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
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
                          duration: 0.3
                        }
                      }}
                      className="relative group"
                    >
                      <InventoryCard {...material} />
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(material)}
                          className="bg-slate-800/80 border-orange-500 text-orange-500 hover:bg-orange-500/20 hover:text-orange-400"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="bg-slate-800/80 border-red-500 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-slate-300 mb-4">No hay materiales con stock bajo</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="zones" className="mt-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
              }
            }}
          >
            <div className="mb-8">
              <motion.h2 
                className="text-xl font-semibold text-white mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.3,
                    ease: "easeOut"
                  }
                }}
              >
                Zonas de Trabajo
              </motion.h2>
              {loadingZones ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : zones.length === 0 ? (
                <div className="text-slate-300">No hay zonas registradas.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {zones.map((zone, index) => (
                    <motion.div
                      key={zone.id}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        transition: {
                          delay: index * 0.1,
                          duration: 0.3
                        }
                      }}
                    >
                      <Card className="bg-slate-800/80 border-slate-700/50">
                        <CardHeader>
                          <CardTitle className="text-white">{zone.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-slate-300 mb-2">{zone.description}</div>
                          <div className="flex flex-col gap-2 mt-4">
                            <Button
                              className="bg-slate-800/80 border-orange-500 text-orange-500 hover:bg-orange-500/20 hover:text-orange-400"
                              onClick={() => handleAssignMaterials(zone)}
                            >
                              Agregar Materiales
                            </Button>
                            <Button
                              className="bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                              onClick={() => handleViewMaterials(zone)}
                            >
                              Ver Materiales
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <MaterialAssignmentModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignToZone}
        materials={materials.map(mat => ({
          id: String(mat.id),
          name: mat.name,
          available: mat.quantity,
          description: mat.description,
          image: mat.image
        }))}
        zoneId={selectedZone?.id ? String(selectedZone.id) : '0'}
      />
      <ViewMaterialsModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        materials={zoneMaterials}
        zoneName={selectedZone?.name}
      />
    </div>
  );
}