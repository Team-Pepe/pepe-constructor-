import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Check, Search } from "lucide-react";

export const CheckOutsManager = ({
  checkinsPorZona,
  selectedZoneFilter,
  setSelectedZoneFilter,
  zonasDisponiblesMap,
  loadingCheckins,
  handleCheckout
}) => {
  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  // Estado para los resultados filtrados
  const [filteredCheckins, setFilteredCheckins] = useState({});

  // Get all unique zones
  const zonasUnicas = Object.keys(checkinsPorZona);
  
  // Filter zones if there's a filter
  const zonasAMostrar = selectedZoneFilter ? [selectedZoneFilter] : zonasUnicas;

  // Efecto para filtrar los check-ins cuando cambia el término de búsqueda o los datos
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar todos los check-ins
      setFilteredCheckins(checkinsPorZona);
      return;
    }

    // Filtrar check-ins por nombre o ID
    const filtered = {};
    
    Object.keys(checkinsPorZona).forEach(zona => {
      const checkinsZonaFiltrados = checkinsPorZona[zona].filter(checkin => {
        const employeeName = (checkin.employee_name || "").toLowerCase();
        const employeeId = (checkin.employee_id || "").toString().toLowerCase();
        const searchTermLower = searchTerm.toLowerCase();
        
        return employeeName.includes(searchTermLower) || employeeId.includes(searchTermLower);
      });
      
      if (checkinsZonaFiltrados.length > 0) {
        filtered[zona] = checkinsZonaFiltrados;
      }
    });
    
    setFilteredCheckins(filtered);
  }, [searchTerm, checkinsPorZona]);

  // Determinar qué datos mostrar: filtrados o todos
  const datosAMostrar = searchTerm.trim() ? filteredCheckins : checkinsPorZona;
  
  // Filtrar las zonas a mostrar basado en los datos filtrados
  const zonasFiltradasAMostrar = selectedZoneFilter 
    ? (datosAMostrar[selectedZoneFilter] ? [selectedZoneFilter] : []) 
    : Object.keys(datosAMostrar);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Gestión de Check-outs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4">
            <label className="font-medium">Filtrar por zona:</label>
            <select
              value={selectedZoneFilter}
              onChange={e => setSelectedZoneFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Todas</option>
              {zonasUnicas.map(zona => (
                <option key={zona} value={zona}>{zona}</option>
              ))}
            </select>
          </div>
          
          {/* Buscador */}
          <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
        
        {loadingCheckins ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : zonasFiltradasAMostrar.length === 0 ? (
          <div className="text-center p-8 text-slate-400">
            No se encontraron resultados para la búsqueda.
          </div>
        ) : (
          zonasFiltradasAMostrar.map(zona => (
            <div key={zona} className="mb-8">
              <h3 className="font-bold text-lg mb-2">Zona: {zona}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2">Empleado</th>
                      <th className="text-left p-2">Zona</th>
                      <th className="text-left p-2">Hora de Check-in</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosAMostrar[zona]?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center p-4 text-slate-400">
                          No hay check-ins activos para esta zona
                        </td>
                      </tr>
                    ) : (
                      datosAMostrar[zona].map((checkin) => (
                        <tr key={checkin.id} className="border-b border-slate-800">
                          <td className="p-2">{checkin.employee_name}</td>
                          <td className="p-2">
                            {(checkin.zone_name && !checkin.zone_name.startsWith('Zona ')) 
                              ? checkin.zone_name 
                              : (zonasDisponiblesMap[checkin.zone_id] || checkin.zoneName || checkin.zone?.name || '-')
                            }
                          </td>
                          <td className="p-2">{checkin.check_in_time}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-sm ${
                              !checkin.check_out_time ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {!checkin.check_out_time ? 'Activo' : 'Terminado'}
                            </span>
                          </td>
                          <td className="p-2">
                            {!checkin.check_out_time && (
                              <Button
                                onClick={() => handleCheckout(checkin.id)}
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Check-out
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};