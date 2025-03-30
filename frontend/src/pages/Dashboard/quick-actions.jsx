"use client"

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionDialog } from "./components/ActionDialog";

export default function QuickActions() {
  return (
    <Card className="bg-slate-800/80 border-orange-500/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-700/50 pb-3">
        <CardTitle className="text-lg font-medium text-orange-500">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 pt-4">
        <ActionDialog
          title="Nueva Tarea"
          description="Crear una nueva tarea o actividad"
          actionText="Crear" />
        <ActionDialog
          title="Generar Reporte"
          description="Generar un reporte de actividades"
          actionText="Generar" />
        <ActionDialog 
          title="Registrar Asistencia" 
          description="Registrar asistencia de personal" 
          actionText="Registrar" />
        <ActionDialog 
          title="Solicitar Materiales" 
          description="Solicitar materiales para obra" 
          actionText="Solicitar" />
      </CardContent>
    </Card>
  );
}

