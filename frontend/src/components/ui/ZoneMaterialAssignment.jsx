import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { ScrollArea } from './scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { fetchWorkZones, fetchMaterials, assignMaterialToZone } from '@/services/dashboardService';

export function ZoneMaterialAssignment() {
  const [zones, setZones] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [zonesResponse, materialsResponse] = await Promise.all([
          fetchWorkZones(),
          fetchMaterials()
        ]);
        setZones(zonesResponse.data);
        setMaterials(materialsResponse.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar las zonas y materiales');
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!selectedZone || !selectedMaterial || !quantity) {
        throw new Error('Por favor completa todos los campos');
      }

      await assignMaterialToZone({
        zoneId: parseInt(selectedZone),
        materialId: parseInt(selectedMaterial),
        quantity: parseFloat(quantity)
      });

      setSuccess('Material asignado correctamente a la zona');
      setSelectedMaterial('');
      setQuantity('');
    } catch (error) {
      console.error('Error al asignar material:', error);
      setError(error.message || 'Error al asignar el material a la zona');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Asignar Materiales a Zonas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zone">Zona de Trabajo</Label>
            <Select
              id="zone"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-900/50 border-slate-700 text-white"
            >
              <option value="">Selecciona una zona</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Select
              id="material"
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full bg-slate-900/50 border-slate-700 text-white"
            >
              <option value="">Selecciona un material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-white"
              placeholder="Ingresa la cantidad"
              min="0"
              step="0.01"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-500/20">
              <AlertDescription className="text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Asignando...' : 'Asignar Material'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 