import React, { useState } from "react";
import PropTypes from "prop-types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UseMaterialsModal({ isOpen, onClose, onUse, materials = [], zoneName = "Zona" }) {
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleUse = () => {
    if (!selectedMaterial || !quantity) {
      setError("Por favor complete todos los campos requeridos");
      return;
    }

    // Safety check for materials array
    if (!Array.isArray(materials)) {
      setError("Error al cargar la lista de materiales");
      return;
    }

    const material = materials.find(m => m.id === selectedMaterial);
    if (!material) {
      setError("Material no encontrado");
      return;
    }

    if (quantity > material.quantity) {
      setError(`Solo hay ${material.quantity} ${material.unit || 'unidades'} disponibles`);
      return;
    }

    onUse({
      materialId: selectedMaterial,
      quantity: Number(quantity),
      notes
    });

    setSelectedMaterial("");
    setQuantity("");
    setNotes("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Registrar Uso de Materiales - {zoneName}</DialogTitle>
          <DialogDescription className="text-slate-300">
            Registre el uso de materiales en esta zona de trabajo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="material" className="text-slate-200">Material</Label>
            <Select onValueChange={setSelectedMaterial} value={selectedMaterial}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Seleccionar material" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {!Array.isArray(materials) || materials.length === 0 ? (
                  <SelectItem value="no-materials" disabled>
                    No hay materiales disponibles
                  </SelectItem>
                ) : (
                  materials.map(material => (
                    <SelectItem 
                      key={material.id} 
                      value={material.id}
                      className="text-white hover:bg-slate-700"
                    >
                      {material.name} ({material.quantity} {material.unit} disponibles)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity" className="text-slate-200">Cantidad Utilizada</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Cantidad utilizada"
              className="bg-slate-700 border-slate-600 text-white"
              min="0.1"
              step="0.1"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-slate-200">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el uso del material..."
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-white hover:bg-slate-700">
            Cancelar
          </Button>
          <Button onClick={handleUse} className="bg-blue-600 hover:bg-blue-700 text-white">
            Registrar Uso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

UseMaterialsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUse: PropTypes.func.isRequired,
  materials: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unit: PropTypes.string
    })
  ),
  zoneName: PropTypes.string
}; 