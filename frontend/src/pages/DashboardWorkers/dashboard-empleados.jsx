import React, { useState, useEffect, useRef } from "react";
import ZonasDeTrabajo from "./zonas-de-trabajo";
import Inventario from "./inventario";
import EmployeeMap from "@/components/ui/EmployeeMap/EmployeeMap";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmployeeCard } from "../Dashboard/components";
import { MapPin, AlertTriangle, Loader2, Package, Home, Map, MapPinned, Warehouse, LogOut, Menu, X, Calendar, Check, Camera, Info, Clock } from "lucide-react";
import axios from "axios";
import fondo2 from "../../assets/fondo2.jpg";
import { useAuth } from "@/features/auth";
import { updateUserLocation, registerCheckIn, fetchRecentCheckIns, apiClient, getAuthHeaders, fetchUserById } from "@/services/dashboardService";
import { useNavigate } from "react-router-dom";
import { PlumberCard } from "../Dashboard/components/PlumberCard";
import { ConstructionWorkerCard } from "../Dashboard/components/ConstructionWorkerCard";
import { ElectricianCard } from "../Dashboard/components/ElectricianCard";

export function DashboardEmpleados() {
  const { user: authUser, roleId, logout } = useAuth(); // Renombramos user a authUser
  const [user, setUser] = useState(authUser); // Añadimos el estado local
  const [activeSection, setActiveSection] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [workerLocation, setWorkerLocation] = useState(null);
  const [savedZones, setSavedZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [selectedCheckInZone, setSelectedCheckInZone] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [checkins, setCheckins] = useState([]);
  const [loadingCheckins, setLoadingCheckins] = useState(false);


  // Verificar si es un trabajador específico que puede solicitar materiales (rol 3)
  const userRoleId = Number(roleId);
  const canRequestMaterials = userRoleId === 3;
  
  console.log("Dashboard empleados - Rol del usuario:", userRoleId, "- Puede solicitar materiales:", canRequestMaterials);

  // Estados para el modal de ubicación
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [locationStatus, setLocationStatus] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";

  // Solicitar permiso de ubicación al iniciar
  useEffect(() => {
    // Mostrar modal al iniciar
    setShowLocationModal(true);
  }, []);

  // Añade un useEffect para cargar los datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        console.log("No hay ID de usuario disponible");
        return;
      }
      
      try {
        const response = await fetchUserById(user.id);
        console.log("Datos obtenidos del usuario:", response);
        
        if (response?.data) {
          // Actualizar el estado con los datos de response.data
          setUser(prevUser => ({
            ...prevUser,
            id: response.data.id?.toString(),
            username: response.data.username,
            name: response.data.username, // Usar username como nombre también
            bloodType: response.data.bloodType,
            roleId: response.data.roleId
          }));
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      }
    };

    fetchUserData();
  }, [user?.id]); // Solo volver a ejecutar si cambia el ID

  // Función para solicitar permiso de ubicación
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Tu navegador no soporta geolocalización');
      return;
    }

    setLocationLoading(true);
    setLocationStatus('Solicitando acceso a ubicación...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('Ubicación obtenida:', { latitude, longitude });
          
          // Actualizar la ubicación en el estado local
          setWorkerLocation({
            lat: latitude,
            lng: longitude
          });

          // Enviar ubicación al backend con la nueva estructura
          try {
            await updateUserLocation({ latitude, longitude });
            
            // Actualizar el estado y cerrar el modal
            setLocationStatus('Ubicación actualizada correctamente');
            setShowLocationModal(false);
            
            // Configurar un intervalo para actualizar la ubicación cada 5 minutos
            const locationInterval = setInterval(() => updateLocation(), 5 * 60 * 1000);
            
            // Devolver función de limpieza
            return () => clearInterval(locationInterval);
          } catch (apiError) {
            console.error('Error al llamar a la API:', apiError);
            
            // Mostrar mensaje de error específico si es posible, pero aun así continuar usando la aplicación
            if (apiError.response?.status === 500) {
              setLocationStatus('El servidor no pudo guardar tu ubicación, pero seguirás viendo el mapa. Por favor, contacta al administrador.');
              // A pesar del error, cerramos el modal después de unos segundos para no bloquear al usuario
              setTimeout(() => setShowLocationModal(false), 5000);
            } else {
              setLocationStatus('Error al actualizar ubicación en el servidor. Inténtalo de nuevo.');
            }
          }
        } catch (error) {
          console.error('Error general al procesar ubicación:', error);
          setLocationStatus('Error al procesar tu ubicación. Inténtalo de nuevo.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Error al obtener ubicación:', error);
        setLocationLoading(false);
        
        // Marcar que el permiso fue denegado
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermissionDenied(true);
        }
        
        // Mensajes personalizados según el error
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationStatus('Se requiere permiso para acceder a la ubicación');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationStatus('Información de ubicación no disponible');
            break;
          case error.TIMEOUT:
            setLocationStatus('Tiempo de espera agotado para obtener ubicación');
            break;
          default:
            setLocationStatus('Error desconocido al obtener ubicación');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Función para actualizar la ubicación periódicamente
  const updateLocation = () => {
    if (!navigator.geolocation || locationPermissionDenied) return;
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Actualizar la ubicación en el estado local
          setWorkerLocation({
            lat: latitude,
            lng: longitude
          });

          // Enviar ubicación al backend
          try {
            await updateUserLocation({ latitude, longitude });
            console.log('Ubicación actualizada en segundo plano');
          } catch (apiError) {
            console.error('Error al llamar a la API para actualizar ubicación:', apiError);
            // No mostramos notificación al usuario para no interrumpir su trabajo
            // pero registramos el error en la consola para diagnóstico
          }
        } catch (error) {
          console.error('Error general al procesar ubicación periódica:', error);
        }
      },
      (error) => {
        console.error('Error al obtener ubicación en segundo plano:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Cargar zonas de trabajo guardadas
  useEffect(() => {
    const fetchSavedZones = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken"); // Obtener token
        const response = await axios.get(`${apiEndpoint}/api/work-zones`, {
          headers: {
            Authorization: `Bearer ${token}` // Añadir header de autenticación
          },
          withCredentials: true // Permitir cookies
        });
        
        if (response.data) {
          const transformedZones = response.data.map(zone => ({
            id: zone.id,
            lat: zone.latitud,
            lng: zone.longitud,
            name: zone.name,
            description: zone.description,
            radius: zone.radius
          }));
          setSavedZones(transformedZones);
        }
      } catch (error) {
        console.error("Error al cargar zonas de trabajo desde API:", error);
        const savedZonesFromStorage = localStorage.getItem("workZones");
        if (savedZonesFromStorage) {
          try {
            const zones = JSON.parse(savedZonesFromStorage);
            setSavedZones(zones);
          } catch (parseError) {
            console.error("Error al parsear zonas de trabajo:", parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSavedZones();
    const interval = setInterval(fetchSavedZones, 30000);
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  const loadRecentCheckIns = async () => {
    try {
      setLoadingCheckIns(true);
      const result = await fetchRecentCheckIns();
      if (result.success) {
        setRecentCheckIns(result.checkIns);
      }
    } catch (error) {
      console.error('Error al cargar check-ins recientes:', error);
    } finally {
      setLoadingCheckIns(false);
    }
  };

  // Cargar check-ins recientes al montar el componente y después de un check-in exitoso
  useEffect(() => {
    loadRecentCheckIns();
  }, []);

  const currentWorker = workerLocation
    ? [
        {
          id: "current",
          name: `${user?.username || user?.name || "Mi ubicación"}`,
          location: workerLocation,
          inZone: false,
        },
      ]
    : [];

  // Renderizar el modal de ubicación
  const renderLocationModal = () => {
    if (!showLocationModal) return null;
  
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
        <div className="bg-black border-2 border-gray-700 p-6 rounded-lg max-w-md w-full shadow-xl">
          <div className="flex items-center justify-center text-white mb-4">
            <MapPin size={48} />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Acceso a ubicación requerido
          </h2>
          <p className="text-gray-300 mb-6 text-center">
            Para poder utilizar el sistema correctamente, necesitamos acceder a tu ubicación. 
            Esto nos permite ubicarte en el mapa de trabajo y gestionar la asignación de tareas.
          </p>
          
          {locationStatus && (
            <div className={`p-4 mb-4 rounded-md ${
              locationStatus.includes('Error') 
                ? 'bg-red-800 border border-red-600 text-red-300' 
                : locationStatus.includes('no pudo guardar')
                  ? 'bg-gray-700 border border-gray-600 text-gray-300'
                  : 'bg-gray-700 border border-gray-600 text-gray-300'
            }`}>
              <p className="text-sm">
                {locationStatus}
              </p>
            </div>
          )}
          
          {locationPermissionDenied && (
            <div className="bg-red-800 border border-red-600 rounded-md p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" size={20} />
                <p className="text-red-300 text-sm">
                  Has rechazado el permiso de ubicación. Por favor, habilita los permisos de ubicación en la configuración de tu navegador y recarga la página.
                </p>
              </div>
            </div>
          )}
          
          {/* Si hay un error de servidor pero la ubicación se obtuvo */}
          {locationStatus && locationStatus.includes('no pudo guardar') && workerLocation && (
            <div className="bg-gray-700 border border-gray-600 rounded-md p-4 mb-4">
              <p className="text-gray-300 text-sm">
                ✅ Ubicación obtenida con éxito: Se usará localmente en el mapa.
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-4">
            <Button 
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3"
              onClick={requestLocationPermission}
              disabled={locationLoading || locationPermissionDenied}
              size="lg"
            >
              {locationLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-5 w-5" />
                  {locationStatus && locationStatus.includes('Error') 
                    ? 'Intentar de nuevo' 
                    : 'Permitir acceso a ubicación'}
                </>
              )}
            </Button>
            
            {/* Permitir continuar incluso si hay errores de backend pero ubicación está disponible */}
            {(locationPermissionDenied || (locationStatus && locationStatus.includes('servidor') && workerLocation)) && (
              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowLocationModal(false)}
              >
                Continuar {workerLocation ? 'con ubicación local' : 'sin ubicación'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleCheckIn = async () => {
    if (!selectedCheckInZone) {
      setCheckInStatus('Debes seleccionar una zona de trabajo');
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus('Tu navegador no soporta geolocalización');
      return;
    }

    setLocationLoading(true);
    setLocationStatus('Verificando ubicación...');
      // Continuar con el proceso de check-in si no ha registrado hoy
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // selectedCheckInZone ya es el objeto zona completo, no necesitamos buscarlo
            const selectedZone = selectedCheckInZone;
            console.log("Zona seleccionada:", selectedZone);

            // Calcular distancia entre el trabajador y el centro de la zona
            const distance = calculateDistance(
              latitude, 
              longitude, 
              selectedZone.lat, 
              selectedZone.lng
            );

            if (distance > (selectedZone.radius || 500)) {
              setCheckInStatus('No estás dentro de la zona seleccionada');
              return;
            }

            // Activar la cámara para tomar la foto
            setShowCamera(true);
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              setCameraStream(stream);
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
              }
            } catch (error) {
              console.error('Error al acceder a la cámara:', error);
              setCheckInStatus('Error al acceder a la cámara. Verifica los permisos.');
              setShowCamera(false);
            }

          } catch (error) {
            console.error('Error al registrar check-in:', error);
            setCheckInStatus('Error al registrar check-in. Inténtalo de nuevo.');
          } finally {
            setLocationLoading(false);
            setLocationStatus(null);
          }
        },
        (error) => {
          console.error('Error al obtener ubicación:', error);
          setLocationLoading(false);
          setLocationStatus('Error al obtener ubicación. Verifica los permisos.');
        }
      );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance * 1000; // Convertir a metros
  };

  const takePicture = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedCheckInZone) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Establecer dimensiones del canvas según el video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Convertir el canvas a blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      
      // Asegurarnos de tener el ID numérico de la zona
      if (!selectedCheckInZone.id || isNaN(parseInt(selectedCheckInZone.id))) {
        throw new Error('ID de zona inválido');
      }

      // Asegurarnos de tener coordenadas válidas
      if (!workerLocation || !workerLocation.lat || !workerLocation.lng || 
          isNaN(parseFloat(workerLocation.lat)) || isNaN(parseFloat(workerLocation.lng))) {
        throw new Error('Coordenadas inválidas');
      }
      
      // Crear un objeto con los datos del check-in en el formato exacto requerido
      const checkInData = {
        zoneId: selectedCheckInZone.id,
        latitude: workerLocation.lat.toString(),
        longitude: workerLocation.lng.toString(),
        photo: blob
      };

      // Registrar el check-in
      await registerCheckIn(checkInData);
      setCheckInStatus('Check-in registrado exitosamente');
      
      // Limpiar
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      setShowCamera(false);
      setSelectedCheckInZone(null);

    } catch (error) {
      console.error('Error al procesar el check-in:', error);
      if (error.message === 'ID de zona inválido') {
        setCheckInStatus('Error: La zona seleccionada no es válida');
      } else if (error.message === 'Coordenadas inválidas') {
        setCheckInStatus('Error: No se pueden obtener las coordenadas actuales');
      } else {
        setCheckInStatus('Error al procesar el check-in. Inténtalo de nuevo.');
      }
    }
  };

  // Limpiar el stream de la cámara al desmontar
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Función para cargar los checkins del día (solo para jefes de obra)
  const loadCheckins = async () => {
    if (userRoleId !== 3) return;
    
    try {
      setLoadingCheckins(true);
      const data = await fetchTodaysCheckins();
      setCheckins(data);
    } catch (error) {
      console.error('Error al cargar los check-ins del día:', error);
    } finally {
      setLoadingCheckins(false);
    }
  };

  // Cargar checkins cuando se monta el componente si es jefe de obra
  useEffect(() => {
    if (userRoleId === 3) {
      loadCheckins();
    }
  }, [userRoleId]);

  // Función para hacer checkout a un trabajador
  const handleCheckout = async (checkInId) => {
    try {
      await registerCheckOut(checkInId);
      // Recargar la lista después del checkout
      loadCheckins();
    } catch (error) {
      console.error('Error al registrar check-out:', error);
    }
  };

  // Renderizar la sección de checkouts para jefes de obra
  const renderCheckouts = () => {
    if (userRoleId !== 3) return null;

    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Gestión de Check-outs
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                ) : checkins.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-slate-400">
                      No hay check-ins activos para el día de hoy
                    </td>
                  </tr>
                ) : (
                  checkins.map((checkin) => (
                    <tr key={checkin.id} className="border-b border-slate-800">
                      <td className="p-2">{checkin.employee_name}</td>
                      <td className="p-2">{checkin.zone_name}</td>
                      <td className="p-2">{new Date(checkin.check_in_time).toLocaleTimeString()}</td>
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
        </CardContent>
      </Card>
    );
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
            <ConstructionWorkerCard
              name={user?.username || "Usuario"} // Usar directamente username
              id={user?.id?.toString() || "N/A"}
              role={
                user?.roleId === 1 ? "Supervisor" :
                user?.roleId === 2 ? "Trabajador" :
                user?.roleId === 3 ? "Jefe de Obra" :
                user?.roleId === 4 ? "Admin" : "Trabajador"
              }
              bloodType={user?.bloodType || "N/A"}
            />
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
              <Map className="mr-2 h-4 w-4" />
              Zonas de Trabajo
            </button>

            <button
              onClick={() => {
                setActiveSection("mapa");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "mapa" ? "bg-gray-100" : ""
              } flex items-center`}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Mi Ubicación
            </button>

            <button
              onClick={() => {
                setActiveSection("zonas-guardadas");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "zonas-guardadas" ? "bg-gray-100" : ""
              } flex items-center`}
            >
              <MapPinned className="mr-2 h-4 w-4" />
              Zonas Guardadas
            </button>

            <button
              onClick={() => {
                setActiveSection("inventario");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "inventario" ? "bg-gray-100" : ""
              } flex items-center`}
            >
              <Warehouse className="mr-2 h-4 w-4" />
              Inventario
            </button>

            {canRequestMaterials && (
              <button
                onClick={() => {
                  navigate("/solicitar-materiales");
                }}
                className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded flex items-center bg-blue-50`}
              >
                <Package className="mr-2 h-4 w-4" />
                Solicitar Materiales
              </button>
            )}
          </nav>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              logout(); // limpia el contexto y storage
              navigate("/login"); // redirige al login
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded flex items-center`}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          menuOpen ? "ml-64" : "ml-0"
        }`}
      >
        {activeSection === "zonas-de-trabajo" && !selectedZone && (
          <section id="zonas-de-trabajo">
            <h2 className="text-2xl font-bold mb-4">Zonas de Trabajo</h2>
            <ZonasDeTrabajo onSelectZone={(zone) => setSelectedZone(zone)} />
          </section>
        )}

        {selectedZone && (
          <section id="solicitar-materiales">
            <h2 className="text-2xl font-bold mb-4">Solicitar Materiales - {selectedZone}</h2>
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
        )}

        {activeSection === "mapa" && (
          <section id="mapa-ubicacion">
            <h2 className="text-2xl font-bold mb-4">Mi Ubicación en Mapa</h2>
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
        )}

        {activeSection === "zonas-guardadas" && (
          <section id="zonas-guardadas">
            <h2 className="text-2xl font-bold mb-4">Zonas de Trabajo Guardadas</h2>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white-500"></div>
              </div>
            ) : savedZones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedZones.map((zone) => (
                  <Card key={zone.id} className="bg-black shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-white-500 to-gray-600 text-white">
                      <CardTitle>{zone.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 bg-white">
                      <p>{zone.description}</p>
                      <p className="text-sm text-gray mt-2">
                        <strong>Radio:</strong> {zone.radius || 500}m
                      </p>
                      <Button
                        onClick={() => setSelectedZone(zone.name)}
                        className="mt-4 w-full"
                      >
                        Ver detalles
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-500">No hay zonas de trabajo guardadas disponibles.</p>
              </div>
            )}
          </section>
        )}

        {activeSection === "inventario" && (
          <section id="inventario">
            <h2 className="text-2xl font-bold mb-4">Inventario de Materiales</h2>
            <Inventario />
          </section>
        )}

        {activeSection === "check-in" && (
          <section id="check-in" className="animate-fadeIn">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <Calendar className="mr-2 h-6 w-6 text-orange-400 animate-pulse" />
                  Check In
                </h2>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 p-6">
                  <div className="flex items-center space-x-4 mb-6 bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
                    <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Registro de Entrada</h3>
                      <p className="text-slate-400">Asegúrate de estar dentro de una zona de trabajo válida</p>
                    </div>
                  </div>

                  {!showCamera ? (
                    <>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Selecciona tu zona de trabajo
                        </label>
                        <div className="relative">
                          <select
                            value={selectedCheckInZone?.name || selectedCheckInZone || ''}
                            onChange={(e) => {
                              const zoneName = e.target.value;
                              if (!zoneName) {
                                setSelectedCheckInZone(null);
                              } else {
                                // Buscar el objeto zona completo
                                const zoneObj = savedZones.find(zone => zone.name === zoneName);
                                if (zoneObj) {
                                  setSelectedCheckInZone(zoneObj);
                                }
                              }
                            }}
                            className="w-full p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                          >
                            <option value="">Selecciona una zona</option>
                            {savedZones.map((zone) => (
                              <option key={zone.id} value={zone.name}>
                                {zone.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <MapPinned className="h-5 w-5 text-slate-500" />
                          </div>
                        </div>
                      </div>

                      {checkInStatus && (
                        <div className={`p-4 mb-6 rounded-lg border transition-all duration-300 animate-slideIn ${
                          checkInStatus.includes('exitosamente') 
                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                            : 'bg-red-500/20 border-red-500/50 text-red-400'
                        }`}>
                          <div className="flex items-start space-x-3">
                            {checkInStatus.includes('exitosamente') ? (
                              <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <Check className="h-4 w-4 text-green-400" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                              </div>
                            )}
                            <p>{checkInStatus}</p>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleCheckIn}
                        className={`w-full h-12 relative overflow-hidden group ${
                          locationLoading || !selectedCheckInZone
                            ? 'bg-slate-700 cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-600'
                        } text-white transition-all duration-300`}
                        disabled={locationLoading || !selectedCheckInZone}
                      >
                        <div className="absolute inset-0 w-full h-full transition-all duration-300 scale-x-0 group-hover:scale-x-100 group-hover:bg-orange-600/50" />
                        <span className="relative flex items-center justify-center">
                          {locationLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Verificando ubicación...
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-5 w-5 animate-bounce" />
                              Registrar Check In
                            </>
                          )}
                        </span>
                      </Button>

                      {!locationLoading && !selectedCheckInZone && (
                        <p className="mt-4 text-sm text-slate-400 text-center animate-pulse">
                          👆 Selecciona una zona para continuar
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="relative animate-fadeIn">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient"></div>
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full rounded-lg mb-4 border-2 border-slate-700/50"
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <div className="flex justify-center gap-4">
                          <Button
                            onClick={takePicture}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105"
                          >
                            <Camera className="h-5 w-5" />
                            <span>Tomar Foto</span>
                          </Button>
                          <Button
                            onClick={() => {
                              if (cameraStream) {
                                cameraStream.getTracks().forEach(track => track.stop());
                              }
                              setCameraStream(null);
                              setShowCamera(false);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105"
                          >
                            <X className="h-5 w-5" />
                            <span>Cancelar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden md:block">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 h-full p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Info className="mr-2 h-5 w-5 text-orange-400" />
                    Información de Check In
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                      <h4 className="text-orange-400 font-medium mb-2">Horario Laboral</h4>
                      <div className="flex items-center space-x-3 text-slate-300">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>7:00 AM - 4:00 PM</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                      <h4 className="text-orange-400 font-medium mb-2">Estado Actual</h4>
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-green-400">En horario laboral</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                      <h4 className="text-orange-400 font-medium mb-2">Información</h4>
                      <p className="text-slate-300 text-sm">
                        Realiza tu check-in al llegar a tu zona de trabajo asignada.
                        Asegúrate de estar físicamente dentro del área designada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {!activeSection && !selectedZone && (
          <>
            <div className="text-center mt-40">
              <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Bienvenido al Panel de Empleados</h3>
                <div className="text-gray-600 mb-6">
                  <p>Selecciona una opción del menú para empezar:</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setActiveSection("mapa")}
                    className="p-4 border rounded-md cursor-pointer hover:bg-blue-50"
                  >
                    <h4 className="font-medium text-black-700">Mi Ubicación</h4>
                    <p className="text-sm text-gray-500">Ver tu ubicación actual en el mapa y zonas cercanas</p>
                  </div>

                  <div
                    onClick={() => setActiveSection("zonas-guardadas")}
                    className="p-4 border rounded-md cursor-pointer hover:bg-blue-50"
                  >
                    <h4 className="font-medium text-black-700">Zonas Guardadas</h4>
                    <p className="text-sm text-gray-500">Ver todas las zonas de trabajo asignadas</p>
                  </div>

                  {canRequestMaterials && (
                    <div
                      onClick={() => navigate("/solicitar-materiales")}
                      className="p-4 border rounded-md cursor-pointer hover:bg-blue-50 mt-4 bg-blue-100 border-blue-300 col-span-2"
                    >
                      <h4 className="font-medium text-black-700">Solicitar Materiales</h4>
                      <p className="text-sm text-gray-500">Realiza solicitudes de materiales para tu zona de trabajo</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de checkouts para jefes de obra */}
            {userRoleId === 3 && (
              <div className="mt-8">
                {renderCheckouts()}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// También exportamos por defecto para mantener compatibilidad
export default DashboardEmpleados;