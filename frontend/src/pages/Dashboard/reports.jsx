import React, { useState, useEffect } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { fetchTodaysCheckins } from "@/services/dashboardService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Reports = () => {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadCheckInsData();
  }, []);

  const loadCheckInsData = async () => {
    try {
      setLoading(true);
      const response = await fetchTodaysCheckins();
      console.log("@@@@@@@@@@@@@@", response);
      
      // Comprobar si la respuesta es un array (lo que parece ser el caso según el log)
      if (Array.isArray(response)) {
        setCheckIns(response);
      } 
      // O si la respuesta contiene una propiedad checkIns
      else if (response && response.checkIns) {
        setCheckIns(response.checkIns);
      }
      // Si no es ninguno de los anteriores, intentamos con otras propiedades comunes
      else if (response && typeof response === 'object') {
        // Buscar cualquier propiedad que pueda ser un array de check-ins
        const arrayProps = Object.keys(response).find(key => Array.isArray(response[key]));
        if (arrayProps) {
          setCheckIns(response[arrayProps]);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar los check-ins:", error);
      setLoading(false);
    }
  };

  const generatePDF = () => {
    setGenerating(true);

    // Crear el PDF
    const doc = new jsPDF();
    
    // Agregar título
    const title = "Reporte de Check-ins Recientes";
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    // Agregar fecha
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-ES');
    doc.setFontSize(11);
    doc.text(`Fecha de generación: ${dateStr}`, 14, 30);

    // Obtener solo los datos del día actual
    const todayStr = today.toLocaleDateString('es-ES');
    const todayCheckIns = checkIns.filter(checkin => {
      if (!checkin.check_in_time) return false;
      
      // Extraer la fecha del check_in_time
      let fechaStr = "";
      if (checkin.check_in_time.includes(',')) {
        fechaStr = checkin.check_in_time.split(',')[0].trim();
      } else if (checkin.check_in_time) {
        try {
          const fecha = new Date(checkin.check_in_time);
          if (!isNaN(fecha.getTime())) {
            fechaStr = fecha.toLocaleDateString('es-ES');
          }
        } catch {
          // No necesitamos manejar este error específicamente
        }
      }
      
      return fechaStr === todayStr;
    });

    // Si no hay datos del día actual, usar todos los check-ins
    const dataToShow = todayCheckIns.length > 0 ? todayCheckIns : checkIns;

    // Preparar datos para la tabla
    const tableData = dataToShow.map(checkin => [
      checkin.employee_name || "Sin nombre",
      checkin.zone_name || "Zona no especificada",
      formatDate(checkin.check_in_time),
      formatTime(checkin.check_in_time),
      checkin.check_out_time ? "Finalizado" : "Activo"
    ]);

    // Generar tabla
    autoTable(doc, {
      head: [["Empleado", "Zona", "Fecha", "Hora de Check-in", "Estado"]],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: {
        fillColor: [233, 87, 6], // Naranja según el tema de la aplicación
        textColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Agregar pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Página ${i} de ${pageCount} - PEPE Constructor`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    // Guardar el PDF
    doc.save(`reporte-checkins-${dateStr.replace(/\//g, '-')}.pdf`);
    
    setGenerating(false);
  };

  // Función auxiliar para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    
    try {
      if (dateString.includes(',')) {
        return dateString.split(',')[0].trim();
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-ES');
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // Función auxiliar para formatear horas
  const formatTime = (dateString) => {
    if (!dateString) return "-";
    
    try {
      if (dateString.includes(',')) {
        const parts = dateString.split(',');
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return "-";
    } catch {
      return "-";
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <FileText className="h-5 w-5 mr-2 text-orange-400" />
          Reportes
        </h2>
        <Button 
          onClick={generatePDF} 
          disabled={loading || generating || checkIns.length === 0}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Generar PDF del día
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700 shadow-md">
        <CardHeader className="bg-slate-900 border-b border-slate-700">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-orange-400" />
            Check-ins Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : checkIns.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No hay datos de check-ins disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-2 text-slate-300">Empleado</th>
                    <th className="text-left p-2 text-slate-300">Zona</th>
                    <th className="text-left p-2 text-slate-300">Fecha</th>
                    <th className="text-left p-2 text-slate-300">Hora de Check-in</th>
                    <th className="text-left p-2 text-slate-300">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {checkIns.map((checkin, index) => (
                    <tr key={checkin.id || index} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="p-2 text-white">{checkin.employee_name || "Sin nombre"}</td>
                      <td className="p-2 text-white">{checkin.zone_name || "Zona no especificada"}</td>
                      <td className="p-2 text-white">{formatDate(checkin.check_in_time)}</td>
                      <td className="p-2 text-white">{formatTime(checkin.check_in_time)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          !checkin.check_out_time ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {!checkin.check_out_time ? 'Activo' : 'Finalizado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports; 