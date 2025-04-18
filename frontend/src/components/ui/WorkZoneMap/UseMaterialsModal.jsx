import React, { useState } from "react";
import PropTypes from "prop-types";
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

    const material = materials.find(m => m.id === selectedMaterial);
    if (!material) {
      setError("Material no encontrado");
      return;
    }

    if (quantity > material.quantity) {
      setError(`Solo hay ${material.quantity} ${material.unit} disponibles`);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Registrar Uso de Materiales - {zoneName}
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="material" className="text-slate-200">Material</Label>
            <Select onValueChange={setSelectedMaterial} value={selectedMaterial}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Seleccionar material" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {materials.map(material => (
                  <SelectItem 
                    key={material.id} 
                    value={material.id}
                    className="text-white hover:bg-slate-700"
                  >
                    {material.name} ({material.quantity} {material.unit} disponibles)
                  </SelectItem>
                ))}
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

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleUse}>
              Registrar Uso
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

UseMaterialsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUse: PropTypes.func.isRequired,
  materials: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unit: PropTypes.string
    })
  ),
  zoneName: PropTypes.string
}; 