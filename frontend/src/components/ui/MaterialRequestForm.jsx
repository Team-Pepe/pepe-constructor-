import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MaterialRequestForm({ onSubmit, materials = [], zones = [], isLoading = false }) {
  const [formData, setFormData] = useState({
    material: "",
    zoneId: "",
    zoneName: "",
    quantity: "",
    notes: ""
  });

  // When materials or zones change (for example, after loading), reset the form
  useEffect(() => {
    setFormData({
      material: "",
      zoneId: "",
      zoneName: "",
      quantity: "",
      notes: ""
    });
  }, [materials, zones]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectZone = (value) => {
    // Intentar convertir a número si es posible
    const numericId = Number(value);
    // Si la conversión no es NaN (es un número válido), usar el número
    const zoneId = isNaN(numericId) ? value : numericId;
    
    const selected = zones.find(zone => zone.id === zoneId);
    
    setFormData({
      ...formData,
      zoneId: zoneId,
      zoneName: selected ? selected.name : ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="bg-slate-800/80 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Solicitud de Material</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="material" className="text-slate-200">Material</Label>
            <Input
              id="material"
              name="material"
              type="text"
              value={formData.material}
              onChange={handleInputChange}
              placeholder="Nombre del material"
              required
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="zone" className="text-slate-200">Zona de Trabajo</Label>
            <Select 
              onValueChange={handleSelectZone} 
              value={formData.zoneId}
              disabled={isLoading || zones.length === 0}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecciona una zona" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {zones.map(zone => (
                  <SelectItem 
                    key={zone.id} 
                    value={zone.id}
                    className="hover:bg-slate-700 focus:bg-slate-700"
                  >
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity" className="text-slate-200">Cantidad (kg)</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="Ej. 20"
              min="0.1"
              step="0.1"
              required
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-slate-200">Notas adicionales (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Algún detalle específico sobre la solicitud..."
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>

          <CardFooter className="px-0 pt-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !formData.material || !formData.zoneId || !formData.quantity}
            >
              {isLoading ? "Procesando..." : "Enviar Solicitud"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

MaterialRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  materials: PropTypes.array,
  zones: PropTypes.array,
  isLoading: PropTypes.bool
}; 