import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import * as turf from "@turf/turf";
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ZoomIn, ZoomOut, Save, Plus, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchWorkZones, postWorkZone } from "@/services/dashboardService";

// Importaciones necesarias para los estilos de Leaflet
import "leaflet/dist/leaflet.css";

// Solución para los íconos de Leaflet en React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Componente para detectar clicks en el mapa
const MapClickHandler = ({ creationMode, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (creationMode) {
        onMapClick(e);
      }
    }
  });
  return null;
};

MapClickHandler.propTypes = {
  onMapClick: PropTypes.func.isRequired,
  creationMode: PropTypes.bool.isRequired
};

// Componente para controlar el zoom
const ZoomController = ({ onZoomIn, onZoomOut }) => {
  const map = useMap();
  
  // Exponer funciones de zoom a través de las props
  useEffect(() => {
    onZoomIn(() => map.setZoom(map.getZoom() + 1));
    onZoomOut(() => map.setZoom(map.getZoom() - 1));
  }, [map, onZoomIn, onZoomOut]);
  
  return null;
};

ZoomController.propTypes = {
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired
};

function WorkZoneMap({ workers = [], defaultCenter = [4.8133, -75.6961], defaultZoom = 13 }) {
  const [workZones, setWorkZones] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [zoneRadius, setZoneRadius] = useState(500); // Radio en metros
  const [showModal, setShowModal] = useState(false);
  const [tempZone, setTempZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    description: "",
    supervisorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [savedZones, setSavedZones] = useState([]);
  const [creationMode, setCreationMode] = useState(false);
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";
  
  // Funciones para el zoom
  const [zoomIn, setZoomIn] = useState(() => () => {});
  const [zoomOut, setZoomOut] = useState(() => () => {});

  // Cargar zonas guardadas al iniciar
  useEffect(() => {
    const fetchSavedZones = async () => {
      try {
        console.log("Cargando zonas guardadas...");
        const response = await fetchWorkZones();
        if (response.data) {
          const zones = response.data.map(zone => ({
            id: zone.id,
            lat: zone.latitud,
            lng: zone.longitud,
            name: zone.name,
            description: zone.description,
            radius: 500, // Valor por defecto
            saved: true
          }));
          setSavedZones(zones);
          // Guardar en localStorage como respaldo
          localStorage.setItem('workZones', JSON.stringify(zones));
        }
      } catch (error) {
        console.error("Error al cargar zonas de trabajo desde API:", error);
        const savedZonesFromStorage = localStorage.getItem('workZones');
        if (savedZonesFromStorage) {
          try {
            const zones = JSON.parse(savedZonesFromStorage);
            setSavedZones(zones);
            console.log("Zonas de trabajo cargadas desde localStorage:", zones);
          } catch (parseError) {
            console.error("Error al parsear zonas de trabajo desde localStorage:", parseError);
          }
        }

      }
    }
    fetchSavedZones();    
  }, []);

  // Función para verificar si un trabajador está dentro de una zona
  const checkWorkersInZones = () => {
    if (!workers || workers.length === 0 || (workZones.length === 0 && savedZones.length === 0)) {
      return workers ? workers.map(worker => ({ ...worker, inZone: false })) : [];
    }

    return workers.map(worker => {
      if (!worker.location) return { ...worker, inZone: false };
      
      const point = turf.point([worker.location.lng, worker.location.lat]);
      
      // Verificar si el trabajador está en alguna zona temporal
      const isInTempZone = workZones.some(zone => {
        const center = turf.point([zone.lng, zone.lat]);
        const distance = turf.distance(point, center, { units: 'meters' });
        return distance <= (zone.radius || zoneRadius);
      });
      
      // Verificar si el trabajador está en alguna zona guardada
      const isInSavedZone = savedZones.some(zone => {
        const center = turf.point([zone.lng, zone.lat]);
        const distance = turf.distance(point, center, { units: 'meters' });
        return distance <= (zone.radius || zoneRadius);
      });
      
      // Incluir información de la zona en la que está el trabajador para mostrarla
      let workerZones = [];
      if (isInTempZone || isInSavedZone) {
        // Encontrar todas las zonas en las que está el trabajador
        [...workZones, ...savedZones].forEach(zone => {
          const center = turf.point([zone.lng, zone.lat]);
          const distance = turf.distance(point, center, { units: 'meters' });
          if (distance <= (zone.radius || zoneRadius)) {
            workerZones.push(zone.name || 'Zona sin nombre');
          }
        });
      }
      
      return { 
        ...worker, 
        inZone: isInTempZone || isInSavedZone,
        zones: workerZones
      };
    });
  };

  // Actualizar los trabajadores cuando cambian las zonas
  useEffect(() => {
    setSelectedWorkers(checkWorkersInZones());
  }, [workZones, savedZones, workers, zoneRadius]);

  // Función para manejar los clicks en el mapa
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    
    // Solo mostrar el modal después de que la zona temporal está configurada
    setTempZone({
      lat,
      lng,
      id: Date.now(),
      saved: false
    });
    
    // Mostrar el modal después de un pequeño retraso para permitir que la zona temporal se renderice primero
    setTimeout(() => {
      setShowModal(true);
      setCreationMode(false); // Desactivar el modo de creación después de un clic
    }, 10);
  };

  // Función para guardar la zona en la base de datos o localStorage
  const saveZone = async () => {
    if (!tempZone || !zoneForm.name || !zoneForm.supervisorId) return;
    
    setLoading(true);
    
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No se encontró token de autenticación");
      setLoading(false);
      return;
    }
  
    // 1. Obtener CSRF token del backend
    let csrfToken;
    try {
      const csrfResponse = await axios.get(`${apiEndpoint}/csrf-token`, {
        withCredentials: true
      });
      csrfToken = csrfResponse.data.csrfToken;
    } catch (csrfError) {
      console.error("Error obteniendo CSRF token:", csrfError);
      setLoading(false);
      return;
    }
  
    // 2. Crear objeto newZone
    const newZone = {
      ...tempZone,
      name: zoneForm.name,
      description: zoneForm.description,
      supervisorId: parseInt(zoneForm.supervisorId),
      id: Date.now(),
      radius: zoneRadius,
      saved: true
    };
    console.log("test#1");
    
    try {
    console.log("test#2");
      const data = {
        name: zoneForm.name,
        description: zoneForm.description,
        supervisorId: parseInt(zoneForm.supervisorId), // Convertir a entero
        latitude: parseFloat(tempZone.lat), // Asegurar que latitude es float
        longitude: parseFloat(tempZone.lng), // Asegurar que longitude es float
        radius: zoneRadius
      }
      const response = await postWorkZone(data)
      console.log("response");
      
      console.log(response);
      
      // Si la creación fue exitosa, usar el ID de la API
      if (response.data.newWorkZone && response.data.newWorkZone.id) {
      console.log("test#3");
        newZone.id = response.data.newWorkZone.id;
      }
      // Actualizar estado y localStorage
      const updatedZones = [...savedZones, newZone];
      setSavedZones(updatedZones);
      localStorage.setItem('workZones', JSON.stringify(updatedZones));
      
      // Limpiar el formulario y el temporal
      setTempZone(null);
      setZoneForm({ name: "", description: "", supervisorId: "" });
      setShowModal(false);
  
    } catch (error) {
      // 5. Manejar errores específicos
      if (error.response?.status === 401) {
        console.error("Sesión expirada - Redirigiendo a login...");
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        console.error("Error CSRF - Recargando página para obtener nuevo token...");
        window.location.reload();
      } else {
        // Guardar en localStorage como respaldo
        const updatedZones = [...savedZones, newZone];
        setSavedZones(updatedZones);
        localStorage.setItem('workZones', JSON.stringify(updatedZones));
        alert("API no disponible. La zona se ha guardado localmente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una zona temporal
  const removeZone = (id) => {
    setWorkZones(workZones.filter(zone => zone.id !== id));
  };
  
  // Función para eliminar una zona guardada
  const deleteSavedZone = async (id) => {
    try {
      // Verificar si es un ID generado localmente (mayor a un valor razonable como 10000)
      const isLocalId = id > 10000 || typeof id === 'string' && id.startsWith('temp-');
      
      if (!isLocalId) {
        // Solo intentar eliminar en la API si es un ID de la base de datos
        const token = localStorage.getItem("authToken");
        try {
          await axios.delete(`${apiEndpoint}/api/work-zones/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log("Zona eliminada exitosamente en la API");
        } catch (apiError) {
          console.error("Error al eliminar en API, continuando con eliminación local:", apiError.message);
        }
      } else {
        console.log("ID local detectado, eliminando solo localmente:", id);
      }
      
      // Siempre eliminar de la lista local y localStorage
      const updatedZones = savedZones.filter(zone => zone.id !== id);
      setSavedZones(updatedZones);
      localStorage.setItem('workZones', JSON.stringify(updatedZones));
      
    } catch (error) {
      console.error("Error general al eliminar la zona:", error);
      
      // Eliminación local como respaldo
      const updatedZones = savedZones.filter(zone => zone.id !== id);
      setSavedZones(updatedZones);
      localStorage.setItem('workZones', JSON.stringify(updatedZones));
    }
  };

  // Cancelar la creación de zona
  const cancelZoneCreation = () => {
    setTempZone(null);
    setZoneForm({ name: "", description: "", supervisorId: "" });
    setShowModal(false);
  };
  
  // Función para confirmar la creación de zona temporal
  const confirmTempZone = () => {
    if (!tempZone || !zoneForm.name) return;
    
    const newZone = {
      ...tempZone,
      name: zoneForm.name,
      description: zoneForm.description,
      supervisorId: zoneForm.supervisorId,
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // ID único con timestamp y string aleatorio
    };
    
    setWorkZones([...workZones, newZone]);
    setTempZone(null);
    setZoneForm({ name: "", description: "", supervisorId: "" });
    setShowModal(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Zonas de Trabajo - Pereira</span>
          <div className="flex space-x-2">
            <Button 
              variant={creationMode ? "default" : "outline"}
              size="sm"
              onClick={() => setCreationMode(!creationMode)}
              title={creationMode ? "Cancelar creación" : "Crear nueva zona"}
              className={creationMode ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {creationMode ? (
                <>
                  <Target size={16} className="mr-1" /> Haz clic en el mapa
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-1" /> Nueva zona
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {creationMode && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
            <p className="flex items-center">
              <Target size={16} className="mr-2" /> 
              <strong>Modo creación activo:</strong> Haz clic en cualquier lugar del mapa para crear una nueva zona de trabajo.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="w-full h-[400px] rounded-md overflow-hidden border relative">
              <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
                zoomControl={false}
              >
                {/* Controladores */}
                <ZoomController 
                  onZoomIn={setZoomIn} 
                  onZoomOut={setZoomOut} 
                />
                <MapClickHandler 
                  creationMode={creationMode} 
                  onMapClick={handleMapClick} 
                />
                
                {/* Estilo de mapa oscuro */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  subdomains="abcd"
                  maxZoom={19}
                />
                
                {/* Renderizar zona temporal si existe */}
                {tempZone && !showModal && (
                  <Circle
                    center={[tempZone.lat, tempZone.lng]}
                    radius={zoneRadius}
                    pathOptions={{
                      fillColor: "#FFA500",
                      fillOpacity: 0.3,
                      color: "#FFA500",
                      weight: 2,
                      dashArray: "5, 5"
                    }}
                  />
                )}
                
                {/* Renderizar zonas de trabajo temporales */}
                {workZones.map((zone) => (
                  <Circle
                    key={zone.id}
                    center={[zone.lat, zone.lng]}
                    radius={zoneRadius}
                    pathOptions={{
                      fillColor: "#4C6EF5",
                      fillOpacity: 0.4,
                      color: "#FFFFFF", // Borde blanco
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">{zone.name || "Zona de Trabajo"}</p>
                        {zone.description && <p className="text-sm">{zone.description}</p>}
                        <p>Radio: {zoneRadius}m</p>
                        <div className="flex space-x-2 mt-2 justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeZone(zone.id)}
                          >
                            <Trash2 size={14} className="mr-1" /> Eliminar
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setTempZone({
                                ...zone,
                                saved: true
                              });
                              setZoneForm({
                                name: zone.name || "",
                                description: zone.description || "",
                                supervisorId: zone.supervisorId || ""
                              });
                              setShowModal(true);
                            }}
                          >
                            <Save size={14} className="mr-1" /> Guardar
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                ))}
                
                {/* Renderizar zonas guardadas en la base de datos */}
                {savedZones.map((zone) => (
                  <Circle
                    key={zone.id}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius || zoneRadius}
                    pathOptions={{
                      fillColor: "#10B981",
                      fillOpacity: 0.4,
                      color: "#FFFFFF", // Borde blanco
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">{zone.name}</p>
                        {zone.description && <p className="text-sm">{zone.description}</p>}
                        <p>Radio: {zone.radius || zoneRadius}m</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-2"
                          onClick={() => deleteSavedZone(zone.id)}
                        >
                          <Trash2 size={14} className="mr-1" /> Eliminar zona
                        </Button>
                      </div>
                    </Popup>
                  </Circle>
                ))}
                
                {/* Renderizar trabajadores en el mapa */}
                {selectedWorkers.map((worker) => {
                  if (!worker.location) return null;
                  
                  return (
                    <Marker
                      key={worker.id}
                      position={[worker.location.lat, worker.location.lng]}
                      icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: ${worker.inZone ? '#10B981' : '#EF4444'}; 
                                width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>`,
                        iconSize: [15, 15],
                      })}
                    >
                      <Popup>
                        <div>
                          <p className="font-semibold">{worker.name}</p>
                          <p className={worker.inZone ? "text-green-600" : "text-red-600"}>
                            {worker.inZone ? "✅ Dentro de la zona" : "❌ Fuera de la zona"}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
              
              {/* Custom Zoom Controls outside of MapContainer */}
              <div className="absolute top-2 right-2 z-[500] flex flex-col space-y-1">
                <button 
                  className="bg-white rounded-md p-1 shadow-md hover:bg-gray-100"
                  onClick={() => zoomIn()}
                >
                  <ZoomIn size={20} className="text-gray-700" />
                </button>
                <button 
                  className="bg-white rounded-md p-1 shadow-md hover:bg-gray-100"
                  onClick={() => zoomOut()}
                >
                  <ZoomOut size={20} className="text-gray-700" />
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <div className="bg-slate-800/20 p-3 rounded-md border border-slate-700/20">
                <h4 className="font-semibold mb-2">Cómo usar el mapa:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Haz clic en el botón <strong>&ldquo;Nueva zona&rdquo;</strong> para activar el modo de creación.</li>
                  <li>Haz clic en cualquier lugar del mapa para ubicar la zona.</li>
                  <li>Completa el formulario con nombre, descripción y supervisorId.</li>
                  <li>Haz clic en <strong>&ldquo;Crear Zona&rdquo;</strong> o <strong>&ldquo;Guardar en BD&rdquo;</strong> para finalizar.</li>
                </ol>
                <div className="mt-3 flex items-center">
                  <label htmlFor="zoneRadius" className="mr-2">Radio de zona (m):</label>
                  <input
                    id="zoneRadius"
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={zoneRadius}
                    onChange={(e) => setZoneRadius(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="ml-2">{zoneRadius}m</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-1 overflow-auto max-h-[400px] border rounded-md">
            <div className="p-4">
              <h3 className="font-semibold mb-2">Estado de Trabajadores</h3>
              {selectedWorkers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay trabajadores para mostrar</p>
              ) : (
                <ul className="space-y-2">
                  {selectedWorkers.map((worker) => (
                    <li 
                      key={worker.id} 
                      className={`p-2 rounded-md text-sm ${
                        worker.inZone ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span className="font-medium">{worker.name}</span>
                      <span className="block text-xs">
                        {worker.inZone ? "✅ Dentro de la zona" : "❌ Fuera de la zona"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="mt-4 border-t pt-4">
                <h3 className="font-semibold mb-2">Leyenda</h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Zona guardada en base de datos</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span>Zona temporal (no guardada)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span>Zona en creación</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de creación/edición de zona */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-semibold mb-4">
                {tempZone.saved ? "Editar Zona de Trabajo" : "Nueva Zona de Trabajo"}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="zoneName">Nombre de la Zona*</Label>
                  <Input 
                    id="zoneName" 
                    value={zoneForm.name} 
                    onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})}
                    placeholder="Ej. Zona Norte"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zoneDescription">Descripción</Label>
                  <Textarea 
                    id="zoneDescription" 
                    value={zoneForm.description} 
                    onChange={(e) => setZoneForm({...zoneForm, description: e.target.value})}
                    placeholder="Descripción de la zona de trabajo"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="supervisorId">Supervisor ID</Label>
                  <Input 
                    id="supervisorId" 
                    type="number"
                    value={zoneForm.supervisorId} 
                    onChange={(e) => setZoneForm({...zoneForm, supervisorId: e.target.value})}
                    placeholder="Ej. 12345"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <div>
                    <span className="block">Latitud:</span>
                    <span>{tempZone.lat.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="block">Longitud:</span>
                    <span>{tempZone.lng.toFixed(6)}</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={cancelZoneCreation}>
                    Cancelar
                  </Button>
                  <Button 
                    disabled={!zoneForm.name || loading} 
                    onClick={tempZone.saved ? saveZone : confirmTempZone}
                  >
                    {loading ? "Guardando..." : tempZone.saved ? "Guardar en BD" : "Crear Zona"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}

WorkZoneMap.propTypes = {
  workers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      location: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired
      })
    })
  ),
  defaultCenter: PropTypes.arrayOf(PropTypes.number),
  defaultZoom: PropTypes.number
};

export default WorkZoneMap;