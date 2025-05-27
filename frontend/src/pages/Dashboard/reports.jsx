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
  const [paymentsCheckIns, setPaymentsCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hourlyRates, setHourlyRates] = useState({
    // Tarifas en inglés (por compatibilidad)
    electrician: 15,
    plumber: 12,
    mason: 10,
    'jefe de obra': 20,
    // Tarifas en español (que es lo que envía el backend ahora)
    'fontanero': 12,
    'eléctrico': 15,
    'albañil': 10,
    'eléctrico': 15,
    // Con espacios por si acaso
    'fontanero ': 12,
    'eléctrico ': 15,
    'albañil ': 10
  });
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'general' for payments tab

  useEffect(() => {
    loadCheckInsData(); // Load data initially and whenever dateFilter changes
  }, [dateFilter]);

  const loadCheckInsData = async () => {
    try {
      setLoading(true);
      let todayCheckIns = [];
      let recentCheckIns = [];

      console.log('🚀 loadCheckInsData INICIANDO...');
      console.log('🚀 Llamando fetchTodaysCheckins...');
      // Fetch both sets of data
      const todayResponse = await fetchTodaysCheckins();
      console.log('🚀 Llamando fetchRecentCheckIns...');
      const generalResponse = await fetchRecentCheckIns(1000);
      
      console.log('===== REPORTS.JSX DEBUG =====');
      console.log('todayResponse from fetchTodaysCheckins:', todayResponse);
      console.log('generalResponse from fetchRecentCheckIns:', generalResponse);
      
      // Process today's check-ins
      if (Array.isArray(todayResponse)) {
        todayCheckIns = todayResponse;
      } else {
        // Handle cases where the response might not be a direct array, though fetchTodaysCheckins should return one
        console.warn("fetchTodaysCheckins did not return an array directly:", todayResponse);
        todayCheckIns = Array.isArray(todayResponse?.data) ? todayResponse?.data : [];
      }
      setCheckIns(todayCheckIns); // Set state for 'Check-ins del Día' tab
      
      // Process recent check-ins
      if (Array.isArray(generalResponse)) {
        recentCheckIns = generalResponse;
      } else if (generalResponse && generalResponse.checkIns) {
        recentCheckIns = generalResponse.checkIns;
      }
      setGeneralCheckIns(recentCheckIns); // Set state for 'Check-ins Generales' tab
      
      // Log the processed data before filtering for payments
      console.log('todayCheckIns after processing:', todayCheckIns.map(item => ({
        id: item.id,
        employee_name: item.employee_name,
        job_type: item.job_type,
        job: item.job,
        jobRaw: item.job
      })));
      
      console.log('recentCheckIns after processing:', recentCheckIns.map(item => ({
        id: item.id,
        employee_name: item.employee_name,
        job_type: item.job_type,
        job: item.job,
        jobRaw: item.job
      })));
      
      // Filter data for 'Pagos' tab based on selected filter
      if (dateFilter === 'today') {
        setPaymentsCheckIns(todayCheckIns); // Use today's check-ins for 'Hoy'
      } else {
        setPaymentsCheckIns(recentCheckIns); // Use all recent check-ins for 'Generales'
      }

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar los check-ins:", error);
      setCheckIns([]);
      setGeneralCheckIns([]);
      setPaymentsCheckIns([]);
      setLoading(false);
    }
  };

  const calculateHoursWorked = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return 0;
    
    // Robust date parsing function
    const parseDate = (dateString) => {
      if (!dateString) return null;
      
      // Attempt to parse DD/MM/YYYY, HH:MM:SS format
      const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/);
      if (parts) {
        // parts[3]=YYYY, parts[2]=MM, parts[1]=DD, parts[4]=HH, parts[5]=MM, parts[6]=SS
        // Month is 0-indexed in Date constructor
        return new Date(parts[3], parts[2] - 1, parts[1], parts[4], parts[5], parts[6]);
      }
      
      // Fallback to standard Date parsing
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };

    const start = parseDate(checkInTime);
    const end = parseDate(checkOutTime);
    
    console.log('calculateHoursWorked inputs and parsed dates:', {
      checkInTime: checkInTime,
      checkOutTime: checkOutTime,
      parsedStart: start,
      parsedEnd: end
    });

    if (!start || !end) {
      console.warn('Failed to parse dates for hours calculation:', { checkInTime, checkOutTime });
      return 0;
    }
    
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs < 0) { // Handle cases where check-out is before check-in (shouldn't happen but as a safeguard)
        console.warn('Check-out time is before check-in time:', { checkInTime, checkOutTime });
        return 0;
    }

    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
  };

  const calculatePayment = (hours, jobType) => {
    // Ensure jobType is a string before calling toLowerCase
    const safeJobType = typeof jobType === 'string' ? jobType.toLowerCase().trim() : 'mason';
    
    // Intentar obtener la tarifa por tipo de trabajo
    let rate = hourlyRates[safeJobType];
    
    // Si no se encuentra, intentar con fallbacks
    if (!rate) {
      // Fallbacks para mapeos inglés-español
      const fallbackMap = {
        'electrician': hourlyRates['eléctrico'] || hourlyRates.electrician,
        'plumber': hourlyRates['fontanero'] || hourlyRates.plumber,
        'mason': hourlyRates['albañil'] || hourlyRates.mason,
        'eléctrico': hourlyRates.eléctrico || hourlyRates.electrician,
        'fontanero': hourlyRates.fontanero || hourlyRates.plumber,
        'albañil': hourlyRates['albañil'] || hourlyRates.mason
      };
      
      rate = fallbackMap[safeJobType];
    }
    
    // Fallback final a albañil/mason
    if (!rate) {
      rate = hourlyRates['albañil'] || hourlyRates.mason || 10;
    }
    
    return Math.round(hours * rate * 100) / 100;
  };

  const getJobTypeDisplay = (jobType) => {
    const types = {
      // Mapeos en inglés (por si acaso)
      'electrician': 'Electricista',
      'plumber': 'Fontanero',
      'mason': 'Albañil',
      'jefe de obra': 'Jefe de Obra',
      // Mapeos en español (que es lo que envía el backend ahora)
      'fontanero': 'Fontanero',
      'eléctrico': 'Electricista',
      'albañil': 'Albañil',
      // Otros posibles mapeos
      'fontanero ': 'Fontanero', // por si viene con espacio
      'eléctrico ': 'Electricista', // por si viene con espacio
      'albañil ': 'Albañil' // por si viene con espacio
    };
    // Ensure jobType is a string before calling toLowerCase
    const safeJobType = typeof jobType === 'string' ? jobType.toLowerCase().trim() : 'mason';
    return types[safeJobType] || 'Albañil';
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
        generatePaymentsPDF(doc, dateStr, paymentsCheckIns);
        break;
      case 'all':
        generateCheckInsPDF(doc, dateStr, checkIns);
        doc.addPage();
        generatePaymentsPDF(doc, dateStr, paymentsCheckIns);
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
      .map((checkin, index) => {
        // Log each checkin data for debugging
        console.log(`Payment processing for checkin ${index}:`, {
          id: checkin.id,
          employee_name: checkin.employee_name,
          job_type: checkin.job_type,
          job: checkin.job,
          jobTypeType: typeof checkin.job_type,
          jobType: typeof checkin.job,
          jobName: checkin.job?.name
        });
        
        const hours = calculateHoursWorked(checkin.check_in_time, checkin.check_out_time);
        // Ensure jobType is a string, defaulting to 'mason' if null, undefined, or not a string
        const jobType = typeof checkin.job_type === 'string' && checkin.job_type ? checkin.job_type : 'mason';
        
        // Calcular tarifa por hora
        const safeJobType = jobType.toLowerCase().trim();
        let hourlyRate = hourlyRates[safeJobType];
        
        if (!hourlyRate) {
          const fallbackMap = {
            'electrician': hourlyRates['eléctrico'] || hourlyRates.electrician,
            'plumber': hourlyRates['fontanero'] || hourlyRates.plumber,
            'mason': hourlyRates['albañil'] || hourlyRates.mason,
            'eléctrico': hourlyRates.eléctrico || hourlyRates.electrician,
            'fontanero': hourlyRates.fontanero || hourlyRates.plumber,
            'albañil': hourlyRates['albañil'] || hourlyRates.mason
          };
          hourlyRate = fallbackMap[safeJobType];
        }
        
        if (!hourlyRate) {
          hourlyRate = hourlyRates['albañil'] || hourlyRates.mason || 10;
        }
        
        // Calcular pago total
        const payment = calculatePayment(hours, jobType);
        
        console.log('Payment calculation details:', {
          employee: checkin.employee_name,
          jobType: jobType,
          hourlyRates: hourlyRates, // Log the whole object to see available rates
          hourlyRate: hourlyRate,
          hours: hours,
          payment: payment
        });

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
            <th className="text-left p-2 text-slate-300">Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((checkin, index) => {
            return (
              <tr key={checkin.id || index} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-2 text-white">{checkin.employee_name || "Sin nombre"}</td>
                <td className="p-2 text-white">{checkin.zone_name || "Zona no especificada"}</td>
                <td className="p-2 text-white">{formatDate(checkin.check_in_time)}</td>
                <td className="p-2 text-white">{formatTime(checkin.check_in_time)}</td>
                <td className="p-2 text-white">{checkin.check_out_time ? formatTime(checkin.check_out_time) : "-"}</td>
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
                {/* Filtro de fecha para Pagos */}
                <div className="flex gap-4 mb-4">
                  <Button
                    variant={dateFilter === 'today' ? 'default' : 'outline'}
                    onClick={() => setDateFilter('today')}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Hoy
                  </Button>
                  <Button
                    variant={dateFilter === 'general' ? 'default' : 'outline'}
                    onClick={() => setDateFilter('general')}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Generales
                  </Button>
                </div>

                {/* Tarifas por hora */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jefe" className="text-white">Jefe de Obra ($/hora)</Label>
                    <Input
                      id="jefe"
                      type="number"
                      value={hourlyRates['jefe de obra']}
                      onChange={(e) => setHourlyRates(prev => ({
                        ...prev,
                        'jefe de obra': parseFloat(e.target.value) || 0
                      }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eléctrico" className="text-white">Electricista ($/hora)</Label>
                    <Input
                      id="eléctrico"
                      type="number"
                      value={hourlyRates.eléctrico}
                      onChange={(e) => setHourlyRates(prev => ({
                        ...prev,
                        eléctrico: parseFloat(e.target.value) || 0,
                        'eléctrico ': parseFloat(e.target.value) || 0, // con espacio también
                        electrician: parseFloat(e.target.value) || 0 // mantener compatibilidad inglés
                      }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fontanero" className="text-white">Fontanero ($/hora)</Label>
                    <Input
                      id="fontanero"
                      type="number"   
                      value={hourlyRates.fontanero}
                      onChange={(e) => setHourlyRates(prev => ({
                        ...prev,
                        fontanero: parseFloat(e.target.value) || 0,
                        'fontanero ': parseFloat(e.target.value) || 0, // con espacio también
                        plumber: parseFloat(e.target.value) || 0 // mantener compatibilidad inglés
                      }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="albanil" className="text-white">Albañil ($/hora)</Label>
                    <Input
                      id="albanil"
                      type="number"
                      value={hourlyRates['albañil']}
                      onChange={(e) => setHourlyRates(prev => ({
                        ...prev,
                        'albañil': parseFloat(e.target.value) || 0,
                        'albañil ': parseFloat(e.target.value) || 0, // con espacio también
                        mason: parseFloat(e.target.value) || 0 // mantener compatibilidad inglés
                      }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                {/* Tabla de pagos */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Resumen de Pagos</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2 text-slate-300">Empleado</th>
                          <th className="text-left p-2 text-slate-300">Cargo</th>
                          <th className="text-left p-2 text-slate-300">Horas Trabajadas</th>
                          <th className="text-left p-2 text-slate-300">Tarifa/Hora</th>
                          <th className="text-left p-2 text-slate-300">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentsCheckIns
                          .filter(checkin => checkin.check_out_time)
                          .map((checkin, index) => {
                            // Log each checkin data for debugging
                            console.log(`Payment processing for checkin ${index}:`, {
                              id: checkin.id,
                              employee_name: checkin.employee_name,
                              job_type: checkin.job_type,
                              job: checkin.job,
                              jobTypeType: typeof checkin.job_type,
                              jobType: typeof checkin.job,
                              jobName: checkin.job?.name
                            });
                            
                            const hours = calculateHoursWorked(checkin.check_in_time, checkin.check_out_time);
                            // Ensure jobType is a string, defaulting to 'mason' if null, undefined, or not a string
                            const jobType = typeof checkin.job_type === 'string' && checkin.job_type ? checkin.job_type : 'mason';
                            
                            // Calcular tarifa por hora
                            const safeJobType = jobType.toLowerCase().trim();
                            let hourlyRate = hourlyRates[safeJobType];
                            
                            if (!hourlyRate) {
                              const fallbackMap = {
                                'electrician': hourlyRates['eléctrico'] || hourlyRates.electrician,
                                'plumber': hourlyRates['fontanero'] || hourlyRates.plumber,
                                'mason': hourlyRates['albañil'] || hourlyRates.mason,
                                'eléctrico': hourlyRates.eléctrico || hourlyRates.electrician,
                                'fontanero': hourlyRates.fontanero || hourlyRates.plumber,
                                'albañil': hourlyRates['albañil'] || hourlyRates.mason
                              };
                              hourlyRate = fallbackMap[safeJobType];
                            }
                            
                            if (!hourlyRate) {
                              hourlyRate = hourlyRates['albañil'] || hourlyRates.mason || 10;
                            }
                            
                            // Calcular pago total
                            const payment = calculatePayment(hours, jobType);
                            
                            console.log('Payment calculation details:', {
                              employee: checkin.employee_name,
                              jobType: jobType,
                              hourlyRates: hourlyRates, // Log the whole object to see available rates
                              hourlyRate: hourlyRate,
                              hours: hours,
                              payment: payment
                            });

                            return (
                              <tr key={checkin.id || index} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="p-2 text-white">{checkin.employee_name || "Sin nombre"}</td>
                                <td className="p-2 text-white">{getJobTypeDisplay(jobType)}</td>
                                <td className="p-2 text-white">{hours} hrs</td>
                                <td className="p-2 text-white">${hourlyRate}/hr</td>
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