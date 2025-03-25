import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Importar el componente Button

const zonas = [
  { id: 1, nombre: "Zona A", descripcion: "Excavación y cimentación", estado: "En progreso" },
  { id: 2, nombre: "Zona B", descripcion: "Estructura metálica", estado: "Pendiente" },
  { id: 3, nombre: "Zona C", descripcion: "Acabados interiores", estado: "Completado" },
];

function ZonasDeTrabajo({ onSelectZone }) {
  return (
    <div className="space-y-4">
      {zonas.map((zona) => (
        <Card key={zona.id}>
          <CardHeader>
            <CardTitle>{zona.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{zona.descripcion}</p>
            <p className="text-sm text-muted-foreground">
              <strong>Estado:</strong> {zona.estado}
            </p>
            <Button
              onClick={() => onSelectZone(zona.nombre)}
              className="mt-4 w-full"
            >
              Seleccionar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ZonasDeTrabajo;