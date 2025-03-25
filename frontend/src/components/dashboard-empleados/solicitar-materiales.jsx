import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SolicitarMateriales() {
  const [form, setForm] = useState({ material: "", cantidad: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Material solicitado: ${form.material}, Cantidad: ${form.cantidad}`);
    setForm({ material: "", cantidad: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulario de Solicitud</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              name="material"
              type="text"
              placeholder="Ej. Cemento"
              value={form.material}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              name="cantidad"
              type="number"
              placeholder="Ej. 50"
              value={form.cantidad}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Solicitar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default SolicitarMateriales;