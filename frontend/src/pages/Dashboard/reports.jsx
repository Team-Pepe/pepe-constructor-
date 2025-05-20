import React, { useState, useEffect } from "react";
import { FileText, Download, Loader2, DollarSign, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { fetchTodaysCheckins, fetchRecentCheckIns } from "@/services/dashboardService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Reports = () => {
  const [checkIns, setCheckIns] = useState([]);
  const [generalCheckIns, setGeneralCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hourlyRates, setHourlyRates] = useState({
    electrician: 15,
    plumber: 12,
    mason: 10
  });

  useEffect(() => {
    loadCheckInsData();
  }, []);

  const loadCheckInsData = async () => {
    try {
      setLoading(true);
      // Cargar check-ins del día
      const todayResponse = await fetchTodaysCheckins();
      // Cargar check-ins generales
      const generalResponse = await fetchRecentCheckIns(1000); // Obtener más registros históricos
      
      // Procesar check-ins del día
      if (Array.isArray(todayResponse)) {
        setCheckIns(todayResponse);
      } 
      else if (todayResponse && todayResponse.checkIns) {
        setCheckIns(todayResponse.checkIns);
      }
      else if (todayResponse && typeof todayResponse === 'object') {
        const arrayProps = Object.keys(todayResponse).find(key => Array.isArray(todayResponse[key]));
        if (arrayProps) {
          setCheckIns(todayResponse[arrayProps]);
        }
      }

      // Procesar check-ins generales
      if (Array.isArray(generalResponse)) {
        setGeneralCheckIns(generalResponse);
      }
      else if (generalResponse && generalResponse.checkIns) {
        setGeneralCheckIns(generalResponse.checkIns);
      }
      else if (generalResponse && typeof generalResponse === 'object') {
        const arrayProps = Object.keys(generalResponse).find(key => Array.isArray(generalResponse[key]));
        if (arrayProps) {
          setGeneralCheckIns(generalResponse[arrayProps]);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar los check-ins:", error);
      setLoading(false);
    }
  };

  const calculateHoursWorked = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return 0;
    
    const start = new Date(checkInTime);
    const end = new Date(checkOutTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
  };

  const calculatePayment = (hours, jobType) => {
    const rate = hourlyRates[jobType.toLowerCase()] || hourlyRates.mason;
    return Math.round(hours * rate * 100) / 100;
  };

  const generatePDF = (type) => {
    setGenerating(true);

    const doc = new jsPDF();
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-ES');
    
    switch(type) {
      case 'checkins':
        generateCheckInsPDF(doc, dateStr, checkIns);
        break;
      case 'general':
        generateCheckInsPDF(doc, dateStr, generalCheckIns);
        break;
      case 'payments':
        generatePaymentsPDF(doc, dateStr, checkIns);
        break;
      case 'all':
        generateCheckInsPDF(doc, dateStr, checkIns);
        doc.addPage();
        generatePaymentsPDF(doc, dateStr, checkIns);
        break;
    }

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
    doc.save(`reporte-${type}-${dateStr.replace(/\//g, '-')}.pdf`);
    
    setGenerating(false);
  };

  const generateCheckInsPDF = (doc, dateStr, data) => {
    // Agregar título
    doc.setFontSize(18);
    doc.text("Reporte de Check-ins", 14, 20);
    doc.setFontSize(11);
    doc.text(`Fecha de generación: ${dateStr}`, 14, 30);

    // Preparar datos para la tabla
    const tableData = data.map(checkin => [
      checkin.employee_name || "Sin nombre",
      checkin.zone_name || "Zona no especificada",
      formatDate(checkin.check_in_time),
      formatTime(checkin.check_in_time),
      checkin.check_out_time ? formatTime(checkin.check_out_time) : "Pendiente",
      checkin.check_out_time ? calculateHoursWorked(checkin.check_in_time, checkin.check_out_time) + " hrs" : "-"
    ]);

    // Generar tabla
    autoTable(doc, {
      head: [["Empleado", "Zona", "Fecha", "Check-in", "Check-out", "Horas"]],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: {
        fillColor: [233, 87, 6],
        textColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
  };

  const generatePaymentsPDF = (doc, dateStr, data) => {
    // Agregar título
    doc.setFontSize(18);
    doc.text("Reporte de Pagos", 14, 20);
    doc.setFontSize(11);
    doc.text(`Fecha: ${dateStr}`, 14, 30);

    // Preparar datos para la tabla de pagos
    const paymentData = data
      .filter(checkin => checkin.check_out_time)
      .map(checkin => {
        const hours = calculateHoursWorked(checkin.check_in_time, checkin.check_out_time);
        const payment = calculatePayment(hours, checkin.job_type || 'mason');
        return [
          checkin.employee_name || "Sin nombre",
          checkin.job_type || "Albañil",
          hours + " hrs",
          `$${payment}`
        ];
      });

    // Generar tabla de pagos
    autoTable(doc, {
      head: [["Empleado", "Cargo", "Horas Trabajadas", "Pago"]],
      body: paymentData,
      startY: 40,
      theme: 'grid',
      headStyles: {
        fillColor: [233, 87, 6],
        textColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
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

  const renderCheckInsTable = (data) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left p-2 text-slate-300">Empleado</th>
            <th className="text-left p-2 text-slate-300">Zona</th>
            <th className="text-left p-2 text-slate-300">Fecha</th>
            <th className="text-left p-2 text-slate-300">Check-in</th>
            <th className="text-left p-2 text-slate-300">Check-out</th>
            <th className="text-left p-2 text-slate-300">Horas</th>
            <th className="text-left p-2 text-slate-300">Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((checkin, index) => {
            const hours = checkin.check_out_time 
              ? calculateHoursWorked(checkin.check_in_time, checkin.check_out_time)
              : null;
            return (
              <tr key={checkin.id || index} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-2 text-white">{checkin.employee_name || "Sin nombre"}</td>
                <td className="p-2 text-white">{checkin.zone_name || "Zona no especificada"}</td>
                <td className="p-2 text-white">{formatDate(checkin.check_in_time)}</td>
                <td className="p-2 text-white">{formatTime(checkin.check_in_time)}</td>
                <td className="p-2 text-white">{checkin.check_out_time ? formatTime(checkin.check_out_time) : "-"}</td>
                <td className="p-2 text-white">{hours ? `${hours} hrs` : "-"}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    !checkin.check_out_time ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {!checkin.check_out_time ? 'Activo' : 'Finalizado'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <FileText className="h-5 w-5 mr-2 text-orange-400" />
          Reportes
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              disabled={loading || generating || checkIns.length === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generar PDF
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => generatePDF('checkins')}>
              Check-ins del día
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generatePDF('general')}>
              Check-ins generales
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generatePDF('payments')}>
              Reporte de pagos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generatePDF('all')}>
              Reporte completo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="checkins" className="w-full">
        <TabsList className="bg-slate-800/50 p-1">
          <TabsTrigger
            value="checkins"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400"
          >
            Check-ins del día
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400"
          >
            Check-ins generales
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400"
          >
            Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkins">
          <Card className="bg-slate-800 border-slate-700 shadow-md">
            <CardHeader className="bg-slate-900 border-b border-slate-700">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-6 w-6 text-orange-400" />
                Check-ins del Día
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
                renderCheckInsTable(checkIns)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card className="bg-slate-800 border-slate-700 shadow-md">
            <CardHeader className="bg-slate-900 border-b border-slate-700">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="h-6 w-6 text-orange-400" />
                Check-ins Generales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                </div>
              ) : generalCheckIns.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No hay datos de check-ins disponibles
                </div>
              ) : (
                renderCheckInsTable(generalCheckIns)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="bg-slate-800 border-slate-700 shadow-md">
            <CardHeader className="bg-slate-900 border-b border-slate-700">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-orange-400" />
                Configuración de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="electrician" className="text-white" >Electricista ($/hora)</Label>
                    <Input
                      id="electrician"
                      type="number"
                      value={hourlyRates.electrician}
                      onChange={(e) => setHourlyRates(prev => ({
                        ...prev,
                        electrician: parseFloat(e.target.value) || 0
                      }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plumber" className="text-white">Fontanero ($/hora)</Label>
                    <Input
                      id="plumber"
                      type="number"   
                      value={hourlyRates.plumber}
                      onChange={(e) => setHourlyRates(prev => ({
                        ...prev,
                        plumber: parseFloat(e.target.value) || 0
                      }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mason" className="text-white">Albañil ($/hora)</Label>
                    <Input
                      id="mason"
                      type="number"
                      value={hourlyRates.mason}
                      onChange={(e) => setHourlyRates(prev => ({
                        ...prev,
                        mason: parseFloat(e.target.value) || 0
                      }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Resumen de Pagos</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2 text-slate-300">Empleado</th>
                          <th className="text-left p-2 text-slate-300">Cargo</th>
                          <th className="text-left p-2 text-slate-300">Horas Trabajadas</th>
                          <th className="text-left p-2 text-slate-300">Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkIns
                          .filter(checkin => checkin.check_out_time)
                          .map((checkin, index) => {
                            const hours = calculateHoursWorked(checkin.check_in_time, checkin.check_out_time);
                            const payment = calculatePayment(hours, checkin.job_type || 'mason');
                            return (
                              <tr key={checkin.id || index} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="p-2 text-white">{checkin.employee_name || "Sin nombre"}</td>
                                <td className="p-2 text-white">{checkin.job_type || "Albañil"}</td>
                                <td className="p-2 text-white">{hours} hrs</td>
                                <td className="p-2 text-white">${payment}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports; 