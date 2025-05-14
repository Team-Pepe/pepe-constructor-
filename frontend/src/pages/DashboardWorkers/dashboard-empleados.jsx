import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { 
  fetchRecentCheckIns,
  fetchUserById,
  fetchTodaysCheckins,
  registerCheckOut
} from "@/services/dashboardService";

// Components
import ZonasDeTrabajo from "./zonas-de-trabajo";
import Inventario from "./inventario";
import EmployeeMap from "@/components/ui/EmployeeMap/EmployeeMap";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Icons
import {
  MapPin, AlertTriangle, Menu, X
} from "lucide-react";

// Background
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

export function DashboardEmpleados() {
  const { user: authUser, roleId, logout } = useAuth();
  const [user, setUser] = useState(authUser);
  const [activeSection, setActiveSection] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Role based permissions
  const canRequestMaterials = useMemo(() => Number(roleId) === 3, [roleId]);

  // Custom hooks
  const { 
    workerLocation, 
    showLocationModal, 
    setShowLocationModal,
    locationStatus, 
    locationPermissionDenied,
    locationLoading,
    requestLocationPermission
  } = useLocationTracking();

  const { savedZones, loading: zonesLoading } = useWorkZones();
  
  const {
    checkInStatus,
    selectedCheckInZone, 
    setSelectedCheckInZone,
    showCamera,
    setShowCamera,
    cameraStream,
    setCameraStream,
    videoRef,
    canvasRef,
    handleCheckIn,
    takePicture
  } = useCheckInStatus({ workerLocation, savedZones });

  // Checkins data
  const [checkins, setCheckins] = useState([]);
  const [loadingCheckins, setLoadingCheckins] = useState(false);
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
            roleId: response.data.roleId
          }));
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
    loadRecentCheckIns();
    
    if (canRequestMaterials) {
      loadCheckins();
    }
  }, [loadRecentCheckIns, loadCheckins, canRequestMaterials]);

  // Current worker location for the map
  const currentWorker = useMemo(() => {
    if (!workerLocation) return [];
    
    return [{
      id: "current",
      name: user?.username || user?.name || "Mi ubicación",
      location: workerLocation,
      inZone: false,
    }];
  }, [workerLocation, user]);

  // Render active section
  const renderActiveSection = () => {
    switch (activeSection) {
      case "zonas-de-trabajo":
        return (
          <section id="zonas-de-trabajo">
            <h2 className="text-2xl font-bold mb-4">Zonas de Trabajo</h2>
            <ZonasDeTrabajo onSelectZone={(zone) => setSelectedZone(zone)} />
          </section>
        );
      
      case "mapa":
        return (
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
        );
      
      case "zonas-guardadas":
        return (
          <section id="zonas-guardadas">
            <h2 className="text-2xl font-bold mb-4">Zonas de Trabajo Guardadas</h2>

            {zonesLoading ? (
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
        );
      
      case "inventario":
        return (
          <section id="inventario">
            <h2 className="text-2xl font-bold mb-4">Inventario de Materiales</h2>
            <Inventario />
          </section>
        );
      
      case "check-in":
        return (
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
      
      default:
        if (selectedZone) {
          return (
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
      />

      {/* Main content */}
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          menuOpen ? "ml-64" : "ml-0"
        }`}
      >
        {renderActiveSection()}
      </main>
    </div>
  );
}

export default DashboardEmpleados;