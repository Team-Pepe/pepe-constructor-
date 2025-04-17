import React, { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryCard } from "@/components/ui/InventoryCard";
import { InventoryForm } from "@/components/ui/InventoryForm";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { getImageUrl } from "@/services/supabaseService";

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
        const response = await axios.get(`${apiEndpoint}/api/materials`);
        console.log('Materiales recibidos:', response.data);
        
        const materialsWithImages = response.data.map(material => {
          // Construir la URL completa de la imagen usando el servicio de Supabase
          const fullImageUrl = material.image_url ? getImageUrl(material.image_url) : null;
          
          return {
            ...material,
            image: fullImageUrl,
            unit: material.unit || "kg"
          };
        });
        
        console.log('Materiales procesados:', materialsWithImages);
        setMaterials(materialsWithImages);
      } catch (err) {
        console.error("Error al cargar materiales:", err);
        setError("No se pudieron cargar los materiales");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleAddMaterial = async (formData) => {
    setIsLoading(true);
    try {
      console.log('Enviando material:', Object.fromEntries(formData.entries()));
      
      const response = await axios.post(`${apiEndpoint}/api/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
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
      console.log('Editando material con datos:', Object.fromEntries(formData.entries()));
      
      const materialId = formData.get('id');
      
      // Asegurarnos de que la ruta coincida con el backend
      const response = await axios.put(`${apiEndpoint}/api/materials/update/${materialId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });
      
      const updatedData = response.data;
      console.log('Respuesta del servidor:', updatedData);
      
      if (!updatedData) {
        throw new Error('No se recibieron datos actualizados del servidor');
      }
      
      // Actualizar el material en el estado local
      const updatedMaterials = materials.map(mat => 
        mat.id === parseInt(materialId)
          ? { 
              ...updatedData,
              image: updatedData.image_url || mat.image, // Mantener la imagen anterior si no se actualizó
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
        // Asegurarnos de que la URL termine sin slash
        const url = `${apiEndpoint}/api/materials/${id}`.replace(/\/$/, '');
        await axios.delete(url);
        
        // Actualizar el estado local solo si la eliminación fue exitosa
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