import React, { useState } from "react";
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Loader2 } from "lucide-react";
import { getImageUrl } from "@/services/supabaseService";
import { fetchWorkZones } from "@/services/dashboardService";
import { useAuth } from "@/features/auth";

export function InventoryCard({ 
  id,
  name, 
  description, 
  quantity, 
  image, 
  unit = "kg",
  onRequestMaterial = null,
  showRequestButton = false 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestData, setRequestData] = useState({
    quantity: "",
    notes: "",
    zoneId: ""
  });
  const [zones, setZones] = useState([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Función para validar si una cadena es base64 válida
  const isValidBase64 = (str) => {
    try {
      // Verificar si la cadena comienza con el formato de data URL
      if (str?.startsWith('data:image')) {
        return true;
      }
      // Verificar si es una cadena base64 válida
      return str && btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  };

  // Función para obtener la URL de la imagen
  const getFullImageUrl = () => {
    if (!image) return null;
    
    // Si ya es una URL completa (incluyendo Supabase Storage), usarla directamente
    if (image.startsWith('http')) {
      return image;
    }
    
    // Si es base64 y ya tiene el prefijo data:image, usarlo directamente
    if (image.startsWith('data:image')) {
      return image;
    }
    
    // Si es base64 sin prefijo, añadir el prefijo
    if (isValidBase64(image)) {
      return `data:image/jpeg;base64,${image}`;
    }
    
    // Intentar construir la URL de Supabase Storage
    return getImageUrl(image);
  };

  const imageUrl = getFullImageUrl();

  // Cargar zonas cuando se abre el diálogo
  const handleOpenRequestDialog = async () => {
    setShowRequestDialog(true);
    setIsLoadingZones(true);
    try {
      const response = await fetchWorkZones();
      setZones(response.data || []);
    } catch (error) {
      console.error("Error al cargar zonas:", error);
      setZones([]);
    } finally {
      setIsLoadingZones(false);
    }
  };

  // Manejar envío de solicitud
  const handleSubmitRequest = async () => {
    if (!requestData.quantity || !requestData.zoneId) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedZone = zones.find(z => z.id === requestData.zoneId);
      const formData = {
        materialId: id,
        materialName: name,
        quantity: parseFloat(requestData.quantity),
        notes: requestData.notes,
        zoneId: requestData.zoneId,
        zoneName: selectedZone?.name || "",
        userId: user?.id,
        userName: user?.name || user?.email
      };

      if (onRequestMaterial) {
        await onRequestMaterial(formData);
      }

      // Limpiar formulario y cerrar diálogo
      setRequestData({ quantity: "", notes: "", zoneId: "" });
      setShowRequestDialog(false);
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
      alert("Error al enviar la solicitud. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card 
        className="relative overflow-hidden hover:shadow-lg transition-all duration-300 bg-slate-800/80 border-slate-700/50 hover:border-orange-500/30 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-48 bg-slate-700">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                console.error('Error loading image:', imageUrl);
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              Sin imagen
            </div>
          )}
          
          {/* Overlay con botón "Pedir" que aparece al hacer hover */}
          {showRequestButton && (
            <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <Button
                onClick={handleOpenRequestDialog}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Pedir
              </Button>
            </div>
          )}
        </div>
        
        <CardHeader className="py-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-white">{name}</CardTitle>
            <Badge 
              variant="outline" 
              className={`${
                quantity > 0 
                  ? "bg-slate-700/80 text-orange-400 border-orange-500/30" 
                  : "bg-red-900/30 text-red-400 border-red-500/30"
              }`}
            >
              {quantity} {unit}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-slate-300 line-clamp-2">{description}</p>
        </CardContent>
      </Card>

      {/* Dialog para solicitar material */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Solicitar Material: {name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Información del material */}
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3">
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt={name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h3 className="font-medium text-white">{name}</h3>
                  <p className="text-sm text-slate-300">{description}</p>
                  <p className="text-sm text-orange-400">Disponible: {quantity} {unit}</p>
                </div>
              </div>
            </div>

            {/* Formulario de solicitud */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="zone" className="text-slate-200">Zona de Trabajo *</Label>
                <Select 
                  onValueChange={(value) => setRequestData({...requestData, zoneId: value})}
                  value={requestData.zoneId}
                  disabled={isLoadingZones}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder={isLoadingZones ? "Cargando zonas..." : "Selecciona una zona"} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {zones.map(zone => (
                      <SelectItem 
                        key={zone.id} 
                        value={zone.id.toString()}
                        className="hover:bg-slate-700 focus:bg-slate-700"
                      >
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity" className="text-slate-200">Cantidad *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={requestData.quantity}
                  onChange={(e) => setRequestData({...requestData, quantity: e.target.value})}
                  placeholder={`Cantidad en ${unit}`}
                  min="0.1"
                  max={quantity}
                  step="0.1"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Máximo disponible: {quantity} {unit}
                </p>
              </div>

              <div>
                <Label htmlFor="notes" className="text-slate-200">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  value={requestData.notes}
                  onChange={(e) => setRequestData({...requestData, notes: e.target.value})}
                  placeholder="Descripción del uso, urgencia, etc..."
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowRequestDialog(false)}
                disabled={isSubmitting}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitRequest}
                disabled={isSubmitting || !requestData.quantity || !requestData.zoneId}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

InventoryCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  quantity: PropTypes.number.isRequired,
  image: PropTypes.string,
  unit: PropTypes.string,
  onRequestMaterial: PropTypes.func,
  showRequestButton: PropTypes.bool
}; 