import React, { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryCard } from "@/components/ui/InventoryCard";
import { InventoryForm } from "@/components/ui/InventoryForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

// Datos de ejemplo (Mock data) - Reemplazar con llamadas a API
const mockMaterials = [
  {
    id: "1",
    name: "Cemento",
    description: "Cemento Portland Tipo I, uso general para construcción.",
    quantity: 500,
    unit: "kg",
    image: "https://i.imgur.com/XoTNlNN.jpg"
  },
  {
    id: "2",
    name: "Varilla de Acero",
    description: "Varilla corrugada de acero de 3/8 pulgadas para refuerzo estructural.",
    quantity: 1200,
    unit: "kg",
    image: "https://i.imgur.com/3o6NCZ3.jpg"
  },
  {
    id: "3",
    name: "Arena",
    description: "Arena fina lavada para mezclas de concreto y mortero.",
    quantity: 2000,
    unit: "kg",
    image: "https://i.imgur.com/J8UBbPB.jpg"
  },
  {
    id: "4",
    name: "Grava",
    description: "Grava de 3/4 pulgada para fabricación de concreto.",
    quantity: 1500,
    unit: "kg",
    image: "https://i.imgur.com/mCcFLib.jpg"
  }
];

const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";

export default function Inventory() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [successMessage, setSuccessMessage] = useState(null);

  // Cargar materiales
  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoading(true);
      try {
        let data;
        
        try {
          // Intentar cargar desde la API
          const response = await axios.get(`${apiEndpoint}/api/materials`);
          data = response.data;
        } catch (apiError) {
          console.warn("Error al cargar desde API, usando datos de muestra:", apiError);
          // Si falla la API, usar datos de muestra
          data = mockMaterials;
        }
        
        setMaterials(data);
      } catch (err) {
        console.error("Error al cargar materiales:", err);
        setError("No se pudieron cargar los materiales. Intente de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleAddMaterial = async (newMaterial) => {
    setIsLoading(true);
    try {
      // Aquí solo se envían a la API los campos básicos (name, description, quantity)
      const materialToSave = {
        name: newMaterial.name,
        description: newMaterial.description,
        quantity: parseFloat(newMaterial.quantity)
      };
      
      // Intentar guardar en la API
      let savedMaterial;
      try {
        const response = await axios.post(`${apiEndpoint}/api/materials`, materialToSave);
        savedMaterial = response.data;
      } catch (apiError) {
        console.warn("Error al guardar en API, usando ID temporal:", apiError);
        // Si falla la API, crear un objeto con ID temporal
        savedMaterial = {
          ...materialToSave,
          id: `temp-${Date.now()}`
        };
      }
      
      // Añadir la imagen que es manejada localmente (no se envía a la base de datos)
      const fullMaterial = {
        ...savedMaterial,
        image: newMaterial.image, // Este es el path/URL local, no almacenado en la BD
        unit: "kg"
      };
      
      setMaterials(prev => [...prev, fullMaterial]);
      setIsDialogOpen(false);
      setSuccessMessage("Material agregado con éxito");
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error al añadir material:", err);
      setError("No se pudo guardar el material. Intente de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMaterial = async (updatedMaterial) => {
    setIsLoading(true);
    try {
      // Preparar datos para enviar a la API (solo los campos básicos)
      const materialToUpdate = {
        id: updatedMaterial.id,
        name: updatedMaterial.name,
        description: updatedMaterial.description,
        quantity: parseFloat(updatedMaterial.quantity)
      };
      
      // Intentar actualizar en la API
      try {
        await axios.put(`${apiEndpoint}/api/materials/${updatedMaterial.id}`, materialToUpdate);
      } catch (apiError) {
        console.warn("Error al actualizar en API, actualizando solo en frontend:", apiError);
      }
      
      // Actualizar en el estado local, manteniendo la imagen
      const updatedMaterials = materials.map(mat => 
        mat.id === updatedMaterial.id 
          ? { 
              ...materialToUpdate, 
              image: updatedMaterial.image || mat.image, // Mantener la imagen anterior si no hay nueva
              unit: mat.unit || "kg"
            } 
          : mat
      );
      
      setMaterials(updatedMaterials);
      setEditingMaterial(null);
      setIsDialogOpen(false);
      setSuccessMessage("Material actualizado con éxito");
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error al editar material:", err);
      setError("No se pudo actualizar el material. Intente de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm("¿Está seguro de que desea eliminar este material?")) {
      setIsLoading(true);
      try {
        // Intentar eliminar en la API
        try {
          await axios.delete(`${apiEndpoint}/api/materials/${id}`);
        } catch (apiError) {
          console.warn("Error al eliminar en API, eliminando solo en frontend:", apiError);
        }
        
        // Eliminar del estado local
        setMaterials(prev => prev.filter(mat => mat.id !== id));
        setSuccessMessage("Material eliminado con éxito");
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error("Error al eliminar material:", err);
        setError("No se pudo eliminar el material. Intente de nuevo más tarde.");
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

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Inventario de Materiales</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={16} />
              <span>Agregar Material</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white">
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

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="low">Stock Bajo</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : materials.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                {filteredMaterials.map(material => (
                  <div key={material.id} className="relative group">
                    <InventoryCard {...material} />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openEditDialog(material)}
                        className="border-white text-white hover:bg-white/20"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="border-white text-white hover:bg-white/20"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
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
        </TabsContent>

        <TabsContent value="low" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredMaterials.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                {filteredMaterials.map(material => (
                  <div key={material.id} className="relative group">
                    <InventoryCard {...material} />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openEditDialog(material)}
                        className="border-white text-white hover:bg-white/20"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="border-white text-white hover:bg-white/20"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-slate-300 mb-4">No hay materiales con stock bajo</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 