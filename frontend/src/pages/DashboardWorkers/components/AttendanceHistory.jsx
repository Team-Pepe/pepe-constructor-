import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2 } from "lucide-react";
import { fetchRecentCheckIns } from "@/services/dashboardService";

export const AttendanceHistory = ({ userId, username, name, zonasDisponiblesMap }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarAsistencias = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        // Increase limit to get more historical records
        const result = await fetchRecentCheckIns(100);
        
        if (result.success && result.checkIns) {
          // Filter only check-ins from the current user
          // Try with different ID formats (string, number)
          const misCheckIns = result.checkIns.filter(checkin => {
            const matchId = checkin.employee_id === userId || 
                          checkin.employee_id === parseInt(userId) || 
                          checkin.employee_id === String(userId);
            
            const matchName = checkin.employee_name === username || 
                           checkin.employee_name === name;
            
            return matchId || matchName;
          }).map(checkin => {
            // Try to find the real zone name using the zones map
            let zoneId = checkin.zone_id;
            if (!zoneId && checkin.zone && checkin.zone.id) {
              zoneId = checkin.zone.id;
            }

            // If we have an ID and it exists in our map, use the real name
            if (zoneId && zonasDisponiblesMap[zoneId]) {
              return {
                ...checkin,
                zone_name: zonasDisponiblesMap[zoneId]
              };
            }

            return checkin;
          });
          
          setAsistencias(misCheckIns);
        } else {
          setAsistencias([]);
        }
      } catch (error) {
        console.error("Error al cargar asistencias:", error);
        setAsistencias([]);
      } finally {
        setLoading(false);
      }
    };

    cargarAsistencias();
  }, [userId, username, name, zonasDisponiblesMap]);

  // Function to safely format dates
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "-";
    
    try {
      // If the date already seems to be formatted as DD/MM/YYYY, return it directly
      if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
        // If it has format DD/MM/YYYY, return only the date part
        if (fechaStr.includes(',')) {
          return fechaStr.split(',')[0].trim();
        }
        return fechaStr;
      }
      
      // Otherwise, try to parse the ISO date
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        return "-"; // If the date is not valid
      }
      return fecha.toLocaleDateString();
    } catch (error) {
      console.error("Error al formatear fecha:", fechaStr, error);
      return "-";
    }
  };

  // Function to safely format times
  const formatearHora = (fechaStr) => {
    if (!fechaStr) return "-";
    
    try {
      // If the date already seems to be formatted as DD/MM/YYYY, HH:MM:SS, extract the time
      if (typeof fechaStr === 'string' && fechaStr.includes('/') && fechaStr.includes(',')) {
        const partes = fechaStr.split(',');
        if (partes.length > 1) {
          const horaParte = partes[1].trim();
          // If it has format HH:MM:SS, return only HH:MM
          const horaMinutos = horaParte.split(':');
          if (horaMinutos.length >= 2) {
            return `${horaMinutos[0]}:${horaMinutos[1]}`;
          }
          return horaParte;
        }
      }
      
      // Otherwise, try to parse the ISO date
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        return "-"; // If the date is not valid
      }
      return fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
      console.error("Error al formatear hora:", fechaStr, error);
      return "-";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto mt-10 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-8 animate-fadeIn border border-slate-700/50"
    >
      <h2 className="text-2xl font-bold mb-6 text-white text-center flex items-center justify-center">
        <Calendar className="mr-2 h-6 w-6 text-orange-400" />
        Mi Historial de Asistencia
      </h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
        </div>
      ) : asistencias.length === 0 ? (
        <div className="text-center text-slate-400 py-8 bg-slate-900/30 rounded-lg border border-slate-700/30">
          No hay registros de asistencia disponibles.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-slate-900/30 rounded-lg shadow border border-slate-700/30">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-3 px-4 text-left font-semibold text-slate-300">Fecha</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-300">Zona</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-300">Check-in</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-300">Check-out</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-300">Estado</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map(asistencia => (
                <tr key={asistencia.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 text-slate-300">
                    {formatearFecha(asistencia.check_in_time)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {(asistencia.zone_name && !asistencia.zone_name.startsWith('Zona ')) 
                      ? asistencia.zone_name 
                      : asistencia.zoneName || asistencia.zone?.name || '-'
                    }
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {formatearHora(asistencia.check_in_time)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {formatearHora(asistencia.check_out_time)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      !asistencia.check_out_time ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {!asistencia.check_out_time ? 'Activo' : 'Completado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}; 