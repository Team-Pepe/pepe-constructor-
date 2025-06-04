import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { 
  fetchRecentCheckIns,
  fetchUserById,
  fetchTodaysCheckins,
  registerCheckOut,
  fetchWorkZones
} from "@/services/dashboardService";

// Components
import ZonasDeTrabajo from "./zonas-de-trabajo";
import Inventario from "./inventario";
import EmployeeMap from "@/components/ui/EmployeeMap/EmployeeMap";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmployeeCard } from "../Dashboard/components";
import { MapPin, AlertTriangle, Loader2, Package, Home, Map, MapPinned, Warehouse, LogOut, Menu, X, Calendar, Check, Camera, Info, Clock } from "lucide-react";
import axios from "axios";
import fondo2 from "../../assets/fondo2.jpg";

// Custom hooks
import { useLocationTracking } from "./hooks/useLocationTracking";
import { useWorkZones } from "./hooks/useWorkZones";
import { useCheckInStatus } from "./hooks/useCheckInStatus";

// Components
import { LocationModal } from "./components/LocationModal";
import { SideMenu } from "./components/SideMenu";
import { CheckInSection } from "./components/CheckInSection";
import { AttendanceHistory } from "./components/AttendanceHistory";
import { CheckOutsManager } from "./components/CheckOutsManager";
import { DashboardHome } from "./components/DashboardHome";
import { MyCardSection } from "./components/MyCardSection";
import { ElectricianCard } from "../Dashboard/components/ElectricianCard";
import { ConstructionWorkerCard } from "../Dashboard/components/ConstructionWorkerCard";
import { ElectricianCard } from "../Dashboard/components/ElectricianCard";
import { PlumberCard } from "../Dashboard/components/PlumberCard";
import { motion } from "framer-motion";

export function DashboardEmpleados() {
  const { user: authUser, roleId, logout } = useAuth(); // Renombramos user a authUser
  const userRoleId = Number(roleId); // Añadir esta línea para definir userRoleId
  const [user, setUser] = useState(authUser); // Añadimos el estado local
  const [activeSection, setActiveSection] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Estados para el chat
  const [showChatModal, setShowChatModal] = useState(false);
  const [workZones, setWorkZones] = useState([]);

  // Estado para determinar si el usuario puede solicitar materiales
  const [canRequestMaterials, setCanRequestMaterials] = useState(false);
  
  // Función para renderizar la tarjeta correcta según el job_id y roleId
  const renderUserCard = () => {
    // Si el usuario tiene roleId 3, siempre mostrar EmployeeCard (jefe de obra)
    if (userRoleId === 3) {
      return (
        <EmployeeCard 
          name={user?.name || user?.username || "Usuario"}
          id={user?.id || "000000"}
          role="Jefe de Obra"
          bloodType={user?.bloodType || "O+"}
        />
      );
    }
    
    // Para otros roles, verificar el job_id
    const jobId = user?.jobId || 2; // Valor por defecto si no hay jobId
    
    switch (Number(jobId)) {
      case 1:
        return (
          <ElectricianCard 
            name={user?.name || user?.username || "Usuario"}
            id={user?.id || "000000"}
            role="Electricista"
            bloodType={user?.bloodType || "O+"}
          />
        );
      case 2:
        return (
          <ConstructionWorkerCard 
            name={user?.name || user?.username || "Usuario"}
            id={user?.id || "000000"}
            role="Constructor"
            bloodType={user?.bloodType || "O+"}
          />
        );
      case 3:
        return (
          <PlumberCard 
            name={user?.name || user?.username || "Usuario"}
            id={user?.id || "000000"}
            role="Fontanero"
            bloodType={user?.bloodType || "O+"}
          />
        );
      default:
        return (
          <ConstructionWorkerCard 
            name={user?.name || user?.username || "Usuario"}
            id={user?.id || "000000"}
            role="Constructor"
            bloodType={user?.bloodType || "O+"}
          />
        );
    }
  };
  
  console.log("Dashboard empleados - Rol del usuario:", userRoleId, "- Puede solicitar materiales:", canRequestMaterials);

  // Estados para el modal de ubicación
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [locationStatus, setLocationStatus] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Estado para filtro de zona
  const [selectedZoneFilter, setSelectedZoneFilter] = useState("");
  const [zonasDisponiblesMap, setZonasDisponiblesMap] = useState({});

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetchUserById(user.id);
        
        if (response?.data) {
          setUser(prevUser => ({
            ...prevUser,
            id: response.data.id?.toString(),
            username: response.data.username,
            name: response.data.username,
            bloodType: response.data.bloodType,
            roleId: response.data.roleId,
            jobId: response.data.jobId || response.data.job_id // Añadir jobId
          }));
          
          // Guardar el jobId en el estado
          setJobId(response.data.jobId);
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      }
    };

    fetchUserData();
  }, [user?.id]);

  // Create map of zone IDs to names
  useEffect(() => {
    const mapaZonas = {};
    savedZones.forEach(zona => {
      mapaZonas[zona.id] = zona.name;
    });
    setZonasDisponiblesMap(mapaZonas);
  }, [savedZones]);

  // Load check-ins
  const loadRecentCheckIns = useCallback(async () => {
    try {
      setLoadingCheckins(true);
      const result = await fetchRecentCheckIns();
      if (result.success) {
        setCheckins(result.checkIns);
      }
    } catch (error) {
      console.error('Error al cargar check-ins recientes:', error);
    } finally {
      setLoadingCheckins(false);
    }
  }, []);

  // Load check-ins for supervisors
  const loadCheckins = useCallback(async () => {
    if (!canRequestMaterials) return;
    
    try {
      setLoadingCheckins(true);
      const data = await fetchTodaysCheckins();
      setCheckins(data);
    } catch (error) {
      console.error('Error al cargar los check-ins del día:', error);
    } finally {
      setLoadingCheckins(false);
    }
  }, [canRequestMaterials]);

  // Handle check-out for a worker
  const handleCheckout = async (checkInId) => {
    try {
      await registerCheckOut(checkInId);
      loadCheckins();
    } catch (error) {
      console.error('Error al registrar check-out:', error);
    }
  };

  // Group check-ins by zone
  const checkinsPorZona = useMemo(() => {
    return checkins.reduce((acc, checkin) => {
      const zona = checkin.zone_name || "Sin zona";
      if (!acc[zona]) acc[zona] = [];
      acc[zona].push(checkin);
      return acc;
    }, {});
  }, [checkins]);

  // Load initial data
  useEffect(() => {
    // Usar las zonas que ya tenemos cargadas en savedZones
    const mapaZonas = {};
    savedZones.forEach(zona => {
      mapaZonas[zona.id] = zona.name;
    });
    setZonasDisponiblesMap(mapaZonas);
  }, [savedZones]);

  // Renderizar la sección de checkouts para jefes de obra
  const renderCheckouts = () => {
    if (!canRequestMaterials) return null;

    // Obtener todas las zonas únicas
    const zonasUnicas = Object.keys(checkinsPorZona);
    // Filtrar zonas si hay filtro
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

  function MiAsistencia() {
    const { user } = useAuth();
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const cargarAsistencias = async () => {
        if (!user?.id) return;
        
        try {
          setLoading(true);
          // Aumentamos el límite para obtener más registros históricos
          const result = await fetchRecentCheckIns(100);
          
          if (result.success && result.checkIns) {
            console.log("Todos los check-ins recibidos:", result.checkIns);
            console.log("ID de usuario actual:", user.id, "Nombre de usuario:", user.username);
            
            // Filtrar solo los check-ins del usuario actual
            // Intentamos con diferentes formatos de ID (string, number)
            const misCheckIns = result.checkIns.filter(checkin => {
              const matchId = checkin.employee_id === user.id || 
                             checkin.employee_id === parseInt(user.id) || 
                             checkin.employee_id === String(user.id);
              
              const matchName = checkin.employee_name === user.username || 
                               checkin.employee_name === user.name;
              
              return matchId || matchName;
            }).map(checkin => {
              // Intentar encontrar el nombre de zona real usando el mapa de zonas
              let zoneId = checkin.zone_id;
              if (!zoneId && checkin.zone && checkin.zone.id) {
                zoneId = checkin.zone.id;
              }

              // Si tenemos un ID y existe en nuestro mapa, usar el nombre real
              if (zoneId && zonasDisponiblesMap[zoneId]) {
                return {
                  ...checkin,
                  zone_name: zonasDisponiblesMap[zoneId]
                };
              }

              return checkin;
            });
            
            console.log("Check-ins filtrados para el usuario:", misCheckIns);
            setAsistencias(misCheckIns);
          } else {
            console.log("No se recibieron check-ins o hubo un error:", result);
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
    }, [user?.id, user?.username, user?.name, zonasDisponiblesMap]);

    // Función para formatear fechas de manera segura
    const formatearFecha = (fechaStr) => {
      if (!fechaStr) return "-";
      
      try {
        // Si la fecha ya parece estar formateada como DD/MM/YYYY, la devolvemos directamente
        if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
          // Si tiene formato DD/MM/YYYY, devolver solo la parte de la fecha
          if (fechaStr.includes(',')) {
            return fechaStr.split(',')[0].trim();
          }
          return fechaStr;
        }
        
        // Si no, intentamos parsear la fecha ISO
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) {
          console.log("Fecha inválida:", fechaStr);
          return "-"; // Si la fecha no es válida
        }
        return fecha.toLocaleDateString();
      } catch (error) {
        console.error("Error al formatear fecha:", fechaStr, error);
        return "-";
      }
    };

    // Función para formatear horas de manera segura
    const formatearHora = (fechaStr) => {
      if (!fechaStr) return "-";
      
      try {
        // Si la fecha ya parece estar formateada como DD/MM/YYYY, HH:MM:SS, extraemos la hora
        if (typeof fechaStr === 'string' && fechaStr.includes('/') && fechaStr.includes(',')) {
          const partes = fechaStr.split(',');
          if (partes.length > 1) {
            const horaParte = partes[1].trim();
            // Si tiene formato HH:MM:SS, devolver solo HH:MM
            const horaMinutos = horaParte.split(':');
            if (horaMinutos.length >= 2) {
              return `${horaMinutos[0]}:${horaMinutos[1]}`;
            }
            return horaParte;
          }
        }
        
        // Si no, intentamos parsear la fecha ISO
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) {
          console.log("Hora inválida:", fechaStr);
          return "-"; // Si la fecha no es válida
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
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `url(${fondo2})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        height: "100vh",
      }}
    >
      {/* Modal de ubicación */}
      {renderLocationModal()}

      {/* Botón para abrir/cerrar el menú */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-2 left-4 z-50 bg-gray-800 text-white px-4 py-1 rounded-md shadow-md flex items-center"
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Menú lateral */}
      <aside
        className={`w-64 bg-white shadow-md flex flex-col justify-between overflow-y-auto transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 fixed h-full z-40`}
      >
        <div>
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800"></h1>
          </div>

          {/* Carnet de empleado */}
          <div className="p-4">
            {renderUserCard()}
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => {
                setActiveSection(null);
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === null && !selectedZone ? "bg-gray-100" : ""
              } flex items-center`}
            >
              <Home className="mr-2 h-4 w-4" />
              Inicio
            </button>

            <button
              onClick={() => {
                setActiveSection("check-in");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "check-in" ? "bg-gray-100" : ""
              } flex items-center`}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Check In
            </button>

            <button
              onClick={() => {
                setActiveSection("zonas-de-trabajo");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "zonas-de-trabajo" ? "bg-gray-100" : ""
              } flex items-center`}
            >
              Zonas de Trabajo
            </motion.h2>
            <ZonasDeTrabajo onSelectZone={(zone) => setSelectedZone(zone)} />
          </section>
        );
      
      case "mapa":
        return (
          <section id="mapa-ubicacion">
            <motion.h2 
              className="text-2xl font-bold mb-4 px-4 py-2 bg-slate-800/90 rounded-lg text-white inline-block"
              initial={{ opacity: 0, y: -20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.3,
                  ease: "easeOut"
                }
              }}
            >
              Mi Ubicación en Mapa
            </motion.h2>
            <EmployeeMap
              workers={currentWorker}
              defaultCenter={[workerLocation?.lat || 4.8133, workerLocation?.lng || -75.6961]}
              defaultZoom={15}
              savedZones={savedZones}
            />
            
            {!workerLocation && (
              <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-md text-yellow-200">
                <div className="flex items-start">
                  <AlertTriangle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium">No se ha detectado tu ubicación</p>
                    <p className="text-sm mt-1">
                      Para ver tu ubicación en el mapa, debes permitir el acceso a la geolocalización.
                    </p>
                    <Button
                      className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                      size="sm"
                      onClick={() => setShowLocationModal(true)}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Activar ubicación
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      
      case "zonas-guardadas":
        return (
          <section id="zonas-guardadas">
            <h2 className="text-2xl font-bold mb-4 px-4 py-2 bg-slate-800/90 rounded-lg text-white inline-block">
              Zonas de Trabajo Guardadas
            </h2>

            {zonesLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white-500"></div>
              </div>
            ) : savedZones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedZones.map((zone, index) => (
                  <motion.div
                    key={zone.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: {
                        delay: index * 0.1,
                        duration: 0.3
                      }
                    }}
                  >
                    <Card className="bg-black shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-white-500 to-gray-600 text-white">
                        <CardTitle>{zone.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 bg-white">
                        <p>{zone.description}</p>
                        <p className="text-sm text-gray mt-2">
                          <strong>Radio:</strong> {zone.radius || 500}m
                        </p>
                        <Button
                          onClick={() => navigate(`/tasks/${zone.id}`, { 
                            state: { 
                              zoneName: zone.nombre,
                              zoneId: zone.id 
                            } 
                          })}
                          className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white"
                        >
                          Ver detalles
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-8 rounded-lg shadow-md text-center"
              >
                <p className="text-gray-500">No hay zonas de trabajo guardadas disponibles.</p>
              </motion.div>
            )}
          </section>
        );
      
      case "inventario":
        return (
          <motion.section 
            id="inventario"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { 
                type: "spring",
                damping: 25,
                stiffness: 300
              }
            }}
          >
            <motion.h2 
              className="text-2xl font-bold mb-4 px-4 py-2 bg-slate-800/90 rounded-lg text-white inline-block"
              initial={{ opacity: 0, y: -20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.3,
                  ease: "easeOut"
                }
              }}
            >
              Inventario de Materiales
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: {
                  delay: 0.1,
                  duration: 0.3
                }
              }}
            >
              <Inventario />
            </motion.div>
          </motion.section>
        );
      
      case "check-in":
        return (
          <section id="check-in">
            <CheckInSection
              selectedCheckInZone={selectedCheckInZone}
              setSelectedCheckInZone={setSelectedCheckInZone}
              savedZones={savedZones}
              checkInStatus={checkInStatus}
              handleCheckIn={handleCheckIn}
              locationLoading={locationLoading}
              showCamera={showCamera}
              videoRef={videoRef}
              canvasRef={canvasRef}
              takePicture={takePicture}
              cameraStream={cameraStream}
              setShowCamera={setShowCamera}
              setCameraStream={setCameraStream}
            />
          </section>
        );
      
      case "mi-asistencia":
        return (
          <AttendanceHistory 
            userId={user?.id} 
            username={user?.username} 
            name={user?.name}
            zonasDisponiblesMap={zonasDisponiblesMap}
          />
        );
      
      case "mi-carnet":
        return (
          <MyCardSection renderUserCard={renderUserCard} />
        );
      
      case "tasks":
        return (
          <section id="tasks">
            <motion.h2 
              className="text-2xl font-bold mb-4 px-4 py-2 bg-slate-800/90 rounded-lg text-white inline-block"
              initial={{ opacity: 0, y: -20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.3,
                  ease: "easeOut"
                }
              }}
            >
              Tareas en {location.state?.zoneName || "Zona"}
            </motion.h2>
            <TaskList 
              zoneId={location.state?.zoneId}
              zoneName={location.state?.zoneName}
              onBack={() => setActiveSection("zonas-guardadas")}
            />
          </section>
        );

      default:
        if (selectedZone) {
          return (
            <section id="solicitar-materiales">
              <h2 className="text-2xl font-bold mb-4 px-4 py-2 bg-slate-800/90 rounded-lg text-white inline-block">
                Solicitar Materiales - {selectedZone}
              </h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="mb-4">
                  Para solicitar materiales para la zona <strong>{selectedZone}</strong>, por favor
                  utilice la sección de Inventario y seleccione esta zona en el formulario.
                </p>
                <Button onClick={() => setActiveSection("inventario")} className="w-full">
                  Ir a Inventario
                </Button>
              </div>
            </section>
          );
        }
        
        return (
          <>
            <DashboardHome 
              setActiveSection={setActiveSection} 
              canRequestMaterials={canRequestMaterials}
              navigate={navigate}
            />
            
            {canRequestMaterials && (
              <div className="mt-8">
                <CheckOutsManager
                  checkinsPorZona={checkinsPorZona}
                  selectedZoneFilter={selectedZoneFilter}
                  setSelectedZoneFilter={setSelectedZoneFilter}
                  zonasDisponiblesMap={zonasDisponiblesMap}
                  loadingCheckins={loadingCheckins}
                  handleCheckout={handleCheckout}
                />
              </div>
            )}
          </>
        );
    }
  };

  // Función para renderizar la tarjeta correcta según el jobId y roleId
  const renderUserCard = () => {
    // Si el roleId es 3 (jefe de obra), mostrar EmployeeCard sin importar el jobId
    if (Number(user?.roleId) === 3) {
      return (
        <EmployeeCard
          name={user?.username || "Usuario"}
          id={user?.id?.toString() || "N/A"}
          role="Jefe de Obra"
          bloodType={user?.bloodType || "N/A"}
        />
      );
    }
    
    // Si no, mostrar la tarjeta según el jobId
    switch (Number(user?.jobId)) {
      case 1:
        return (
          <ElectricianCard
            name={user?.username || "Usuario"}
            id={user?.id?.toString() || "N/A"}
            role="Electricista"
            bloodType={user?.bloodType || "N/A"}
          />
        );
      case 2:
        return (
          <ConstructionWorkerCard
            name={user?.username || "Usuario"}
            id={user?.id?.toString() || "N/A"}
            role="Albañil"
            bloodType={user?.bloodType || "N/A"}
          />
        );
      case 3:
        return (
          <PlumberCard
            name={user?.username || "Usuario"}
            id={user?.id?.toString() || "N/A"}
            role="Fontanero"
            bloodType={user?.bloodType || "N/A"}
          />
        );
      default:
        return (
          <ConstructionWorkerCard
            name={user?.username || "Usuario"}
            id={user?.id?.toString() || "N/A"}
            role={
              user?.roleId === 1 ? "Supervisor" :
              user?.roleId === 2 ? "Trabajador" :
              user?.roleId === 3 ? "Jefe de Obra" :
              user?.roleId === 4 ? "Admin" : "Trabajador"
            }
            bloodType={user?.bloodType || "N/A"}
          />
        );
    }
  };
  
  // Función para abrir el chat
  const handleChatClick = () => {
    setShowChatModal(true);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `url(${fondo2})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        height: "100vh",
      }}
    >
      {/* Location permission modal */}
      <LocationModal
        showLocationModal={showLocationModal}
        setShowLocationModal={setShowLocationModal}
        locationStatus={locationStatus}
        locationPermissionDenied={locationPermissionDenied}
        locationLoading={locationLoading}
        requestLocationPermission={requestLocationPermission}
        workerLocation={workerLocation}
      />

      {/* Menu toggle button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-2 left-4 z-50 bg-gray-800 text-white px-4 py-1 rounded-md shadow-md flex items-center"
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Side menu */}
      <SideMenu
        menuOpen={menuOpen}
        user={user}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        setSelectedZone={setSelectedZone}
        canRequestMaterials={canRequestMaterials}
        navigate={navigate}
        logout={logout}
        renderUserCard={renderUserCard}
        onChatClick={handleChatClick}
      />

      {/* Main content */}
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          menuOpen ? "ml-64" : "ml-0"
        }`}
      >
        {renderActiveSection()}
      </main>

      {/* Chat Modal */}
      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          workZones={workZones}
        />
      )}
    </div>
  );
}

export default DashboardEmpleados;