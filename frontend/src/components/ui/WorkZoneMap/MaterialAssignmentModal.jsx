import React, { useState } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const MaterialAssignmentModal = ({ isOpen, onClose, onAssign, materials = [], zoneId }) => {
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMaterial || !quantity) {
      setError("Por favor complete todos los campos");
      return;
    }

    const material = materials.find(m => m.id === selectedMaterial);
    if (!material) {
      setError("Material no encontrado");
      return;
    }

    if (quantity > material.available) {
      setError(`Solo hay ${material.available} unidades disponibles`);
      return;
    }

    onAssign({
      materialId: selectedMaterial,
      quantity: Number(quantity),
      zoneId
    });

    setSelectedMaterial("");
    setQuantity("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Asignar Materiales a la Zona</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material" className="text-white">Material</Label>
            <Select 
              value={selectedMaterial} 
              onValueChange={setSelectedMaterial}
            >
              <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecciona un material" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 text-white">
                {materials.map((material) => (
                  <SelectItem 
                    key={material.id} 
                    value={material.id}
                    className="hover:bg-slate-600 focus:bg-slate-600"
                  >
                    <div className="flex items-center space-x-2">
                      {material.image && (
                        <img 
                          src={material.image} 
                          alt={material.name} 
                          className="w-6 h-6 object-cover rounded"
                        />
                      )}
                      <span>{material.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-white">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              min="1"
              required
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Asignar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

MaterialAssignmentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  materials: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      available: PropTypes.number.isRequired,
      description: PropTypes.string,
      image: PropTypes.string
    })
  ).isRequired,
  zoneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default MaterialAssignmentModal; 