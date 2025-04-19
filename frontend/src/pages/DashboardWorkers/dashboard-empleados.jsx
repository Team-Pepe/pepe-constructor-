import React, { useState, useEffect } from "react";
import ZonasDeTrabajo from "./zonas-de-trabajo";
import Inventario from "./inventario";
import EmployeeMap from "@/components/ui/EmployeeMap/EmployeeMap";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmployeeCard } from "../Dashboard/components";
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import axios from "axios";
import fondo2 from "../../assets/fondo2.jpg";
import { useAuth } from "@/features/auth";
import { updateUserLocation } from "@/services/dashboardService";
import { useNavigate } from "react-router-dom";

function DashboardEmpleados() {
  const { user, roleId, logout } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [workerLocation, setWorkerLocation] = useState(null);
  const [savedZones, setSavedZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

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

          // Enviar ubicación al backend
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
        className="absolute top-2 left-4 z-50 bg-gray-800 text-white px-4 py-1 rounded-md shadow-md"
      >
        {menuOpen ? "×" : "☰"}
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
            <EmployeeCard
              name={user?.username || user?.name || "Empleado"}
              email={user?.email || ""}
              role="Trabajador de Obra"
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
              }`}
            >
              Inicio
            </button>

            <button
              onClick={() => {
                setActiveSection("zonas-de-trabajo");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "zonas-de-trabajo" ? "bg-gray-100" : ""
              }`}
            >
              Zonas de Trabajo
            </button>

            <button
              onClick={() => {
                setActiveSection("mapa");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "mapa" ? "bg-gray-100" : ""
              }`}
            >
              Mi Ubicación
            </button>

            <button
              onClick={() => {
                setActiveSection("zonas-guardadas");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "zonas-guardadas" ? "bg-gray-100" : ""
              }`}
            >
              Zonas Guardadas
            </button>

            <button
              onClick={() => {
                setActiveSection("inventario");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "inventario" ? "bg-gray-100" : ""
              }`}
            >
              Inventario
            </button>
          </nav>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              logout(); // limpia el contexto y storage
              navigate("/login"); // redirige al login
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === "inventario" ? "bg-gray-100" : ""
            }`}
          >
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

        {!activeSection && !selectedZone && (
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
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardEmpleados;