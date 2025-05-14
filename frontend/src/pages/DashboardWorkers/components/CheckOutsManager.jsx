import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Check } from "lucide-react";

export const CheckOutsManager = ({
  checkinsPorZona,
  selectedZoneFilter,
  setSelectedZoneFilter,
  zonasDisponiblesMap,
  loadingCheckins,
  handleCheckout
}) => {
  // Get all unique zones
  const zonasUnicas = Object.keys(checkinsPorZona);
  
  // Filter zones if there's a filter
  const zonasAMostrar = selectedZoneFilter ? [selectedZoneFilter] : zonasUnicas;

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Gestión de Check-outs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
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
        {zonasAMostrar.map(zona => (
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
                  {loadingCheckins ? (
                    <tr>
                      <td colSpan="5" className="text-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : checkinsPorZona[zona]?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-4 text-slate-400">
                        No hay check-ins activos para esta zona
                      </td>
                    </tr>
                  ) : (
                    checkinsPorZona[zona].map((checkin) => (
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
        ))}
      </CardContent>
    </Card>
  );
}; 