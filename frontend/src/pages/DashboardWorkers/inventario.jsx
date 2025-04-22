import React, { useState, useEffect } from "react";
import { InventoryCard } from "@/components/ui/InventoryCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MaterialRequestForm } from "@/components/ui/MaterialRequestForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// Zonas de trabajo de ejemplo
const mockZones = [
  { id: "1", name: "Edificio Principal - Nivel 1" },
  { id: "2", name: "Edificio Principal - Nivel 2" },
  { id: "3", name: "Parqueadero" },
  { id: "4", name: "Zona de Almacenamiento" }
];

export default function Inventario() {
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
        // Aquí normalmente haríamos llamadas a API
        // const materialsResponse = await fetch('api/materials');
        // const zonesResponse = await fetch('api/workzones');
        
        // Simulando carga de datos con un retraso
        setTimeout(() => {
          setMaterials(mockMaterials);
          setZones(mockZones);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("No se pudieron cargar los datos. Intente de nuevo más tarde.");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredMaterials = materials.filter(material => 
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold text-white">Inventario de Materiales</h1>
        
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
                {filteredMaterials.map(material => (
                  <div key={material.id}>
                    <InventoryCard {...material} />
                  </div>
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
                  .map(material => (
                    <div key={material.id}>
                      <InventoryCard {...material} />
                    </div>
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