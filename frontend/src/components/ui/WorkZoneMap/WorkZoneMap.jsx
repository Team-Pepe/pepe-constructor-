import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import * as turf from "@turf/turf";
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ZoomIn, ZoomOut, Save, Plus, Target, Package, List, FileInput, Loader2 } from "lucide-react";
import { fetchWorkZones, createWorkZone, deleteWorkZone, fetchZoneMaterials, assignMaterialsToZone, useMaterialsFromZone, fetchMaterials } from "@/services/dashboardService";
import { useAuth } from "@/features/auth";
import { MaterialAssignmentModal } from "./MaterialAssignmentModal";
import { ViewMaterialsModal } from "./ViewMaterialsModal";
import { UseMaterialsModal } from "./UseMaterialsModal";

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
  const { roleId } = useAuth();
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
  const [showMaterialAssignmentModal, setShowMaterialAssignmentModal] = useState(false);
  const [showViewMaterialsModal, setShowViewMaterialsModal] = useState(false);
  const [showUseMaterialsModal, setShowUseMaterialsModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneMaterials, setZoneMaterials] = useState([]);
  const [authError, setAuthError] = useState("");
  const [availableMaterials, setAvailableMaterials] = useState([]);
  
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

  // Cargar materiales disponibles al iniciar
  useEffect(() => {
    const loadAvailableMaterials = async () => {
      try {
        console.log("Solicitando materiales disponibles...");
        const response = await fetchMaterials();
        console.log("Respuesta completa de fetchMaterials:", response);
        
        // Intentamos acceder a los datos de diferentes maneras según la estructura de respuesta
        let materialsData = null;
        
        if (response && response.data) {
          // Caso 1: response.data es directamente el array de materiales
          if (Array.isArray(response.data)) {
            materialsData = response.data;
            console.log("Caso 1: response.data es un array");
          } 
          // Caso 2: Los materiales están anidados en una propiedad de response.data
          else if (typeof response.data === 'object') {
            console.log("Caso 2: explorando objeto response.data");
            
            // Revisar las propiedades más comunes donde podrían estar los materiales
            const possiblePaths = ['materials', 'items', 'results', 'data'];
            
            for (const path of possiblePaths) {
              if (response.data[path] && Array.isArray(response.data[path])) {
                materialsData = response.data[path];
                console.log(`Encontrado array en response.data.${path}`);
                break;
              }
            }
            
            // Si no encontramos en las rutas comunes, intentamos encontrar cualquier array
            if (!materialsData) {
              for (const key in response.data) {
                if (Array.isArray(response.data[key])) {
                  materialsData = response.data[key];
                  console.log(`Encontrado array en response.data.${key}`);
                  break;
                }
              }
            }
          }
        }
        
        // Si no pudimos encontrar los datos de ninguna manera, establecemos un array vacío
        if (!materialsData) {
          console.error("No se pudo encontrar un array en la respuesta:", response);
          materialsData = [];
        }
        
        // Transformar los datos para asegurar que tengan la estructura correcta
        const transformedMaterials = materialsData.map(material => {
          // Intenta identificar cada propiedad haciendo log de sus valores
          console.log("Procesando material:", material);
          
          // Buscar propiedades anidadas (por ejemplo, material.material.name)
          let nestedMaterial = null;
          if (material.material && typeof material.material === 'object') {
            console.log("Encontrado objeto anidado 'material':", material.material);
            nestedMaterial = material.material;
          }
          
          console.log("ID:", material.id, material.id_material, material.material_id, nestedMaterial?.id);
          console.log("Nombre:", material.name, material.nombre, material.material_name, nestedMaterial?.name, nestedMaterial?.nombre);
          console.log("Cantidad:", material.quantity, material.cantidad, material.cantidad_disponible, material.cantidad_asignada, material.available_quantity, nestedMaterial?.quantity);
          
          // Extraer la cantidad correctamente, priorizando la cantidad de la zona
          const quantity = 
            // Primero las propiedades directas más probables
            material.cantidad_disponible || 
            material.cantidad_asignada || 
            material.cantidad || 
            material.quantity || 
            material.available_quantity ||
            // Luego propiedades anidadas
            nestedMaterial?.cantidad_disponible ||
            nestedMaterial?.cantidad ||
            nestedMaterial?.quantity ||
            0;
          
          // Material transformado con todas las posibles fuentes de datos
          const transformedMaterial = {
            id: material.id || material.id_material || material.material_id || nestedMaterial?.id || '0',
            name: material.nombre || material.name || material.material_name || nestedMaterial?.name || nestedMaterial?.nombre || 'Material sin nombre',
            quantity: quantity,
            unit: material.unidad || material.unit || material.units || nestedMaterial?.unidad || nestedMaterial?.unit || 'unidades',
            description: material.descripcion || material.description || material.desc || nestedMaterial?.descripcion || nestedMaterial?.description || '',
            raw: material // Guardamos el objeto original para depuración
          };
          
          console.log("Material transformado:", transformedMaterial);
          return transformedMaterial;
        });
        
        console.log("Materiales encontrados (transformados):", transformedMaterials);
        setAvailableMaterials(transformedMaterials);
      } catch (error) {
        console.error("Error al cargar materiales disponibles:", error);
        setAvailableMaterials([]);
      }
    };
    loadAvailableMaterials();
  }, []);

  // Función para verificar si un trabajador está dentro de una zona
  const checkWorkersInZones = () => {
    // Registrar para depuración
    console.log("checkWorkersInZones - Datos iniciales:", {
      workers: workers ? `Array de ${workers.length} elementos` : "undefined/null",
      workZones: workZones ? `Array de ${workZones.length} elementos` : "undefined/null",
      savedZones: savedZones ? `Array de ${savedZones.length} elementos` : "undefined/null"
    });
    
    // Verificar si hay trabajadores
    if (!workers || !Array.isArray(workers) || workers.length === 0) {
      console.log("No hay trabajadores para procesar");
      return [];
    }
    
    // Ver cuántos trabajadores tienen ubicación
    const workersWithLocation = workers.filter(worker => 
      worker && worker.location && 
      typeof worker.location.lat === 'number' && 
      typeof worker.location.lng === 'number'
    );
    
    console.log(`De ${workers.length} trabajadores, ${workersWithLocation.length} tienen ubicación válida`);
    
    // Si no hay zonas, solo devolver los trabajadores con su estado inZone = false
    if ((workZones.length === 0 && savedZones.length === 0)) {
      console.log("No hay zonas definidas, todos los trabajadores fuera de zona");
      return workers.map(worker => ({ 
        ...worker, 
        inZone: false,
        zones: []
      }));
    }

    // Filtrar solo trabajadores con ubicación válida
    return workers.map(worker => {
      // Si el trabajador no tiene ubicación, marcarlo como fuera de zona
      if (!worker || !worker.location || 
          typeof worker.location.lat !== 'number' || 
          typeof worker.location.lng !== 'number') {
        return { 
          ...worker, 
          inZone: false,
          zones: [] 
        };
      }
      
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
    
    // Crear la zona temporal
    setTempZone({
      lat,
      lng,
      id: Date.now(),
      saved: false
    });
    
    console.log("Creando zona temporal en:", lat, lng);
    
    // Mostrar el modal para completar los datos de la zona
    setTimeout(() => {
      setShowModal(true);
      setCreationMode(false); // Desactivar el modo de creación después de un clic
    }, 100);
  };

  // Función para guardar la zona en la base de datos o localStorage
  const handleSaveZone = async () => {
    if (!tempZone || !zoneForm.name || !zoneForm.supervisorId) return;
    
    setLoading(true);
    
    // Crear objeto newZone
    const newZone = {
      ...tempZone,
      name: zoneForm.name,
      description: zoneForm.description,
      supervisorId: parseInt(zoneForm.supervisorId),
      id: Date.now(),
      radius: zoneRadius,
      saved: true
    };
    
    try {
      const data = {
        name: zoneForm.name,
        description: zoneForm.description,
        supervisorId: parseInt(zoneForm.supervisorId), // Convertir a entero
        latitude: parseFloat(tempZone.lat), // Asegurar que latitude es float
        longitude: parseFloat(tempZone.lng), // Asegurar que longitude es float
        radius: zoneRadius
      }
      
      console.log("Enviando datos de la zona:", data);
      
      const response = await createWorkZone(data);
      
      console.log("Respuesta del servidor:", response);
      
      // Si la creación fue exitosa, usar el ID de la API
      if (response.data && response.data.newWorkZone && response.data.newWorkZone.id) {
        console.log("Zona creada exitosamente con ID:", response.data.newWorkZone.id);
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
      console.error("Error al crear zona:", error);
      
      // Manejo de errores específicos
      if (error.response?.status === 401) {
        console.error("Sesión expirada - Redirigiendo a login...");
        setAuthError("Sesión expirada. Redirigiendo al inicio de sesión...");
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (error.response?.status === 403) {
        console.error("Error de permisos - Recargando página para obtener nuevo token...");
        setAuthError("Error de permisos. Recargando la página...");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        // Guardar en localStorage como respaldo
        setAuthError(`Error al crear zona: ${error.message || 'Error desconocido'}`);
        
        // Aún así, guardar en localStorage para no perder el trabajo del usuario
        const updatedZones = [...savedZones, newZone];
        setSavedZones(updatedZones);
        localStorage.setItem('workZones', JSON.stringify(updatedZones));
        
        setTimeout(() => {
          setAuthError("");
          setShowModal(false);
        }, 3000);
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
        try {
          await deleteWorkZone(id);
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

  // Función para manejar errores de autenticación
  const handleAuthError = (error) => {
    console.error("Error de autenticación:", error);
    if (error.response?.status === 401) {
      setAuthError("Sesión expirada. Por favor, inicie sesión nuevamente.");
      // Redirigir al login
      window.location.href = '/login';
    } else {
      setAuthError(error.message || "Error de autenticación");
    }
  };

  // Modificar loadZoneMaterials para manejar la estructura correcta del response
  const loadZoneMaterials = async (zoneId) => {
    try {
      setAuthError(""); // Limpiar errores previos
      console.log("Solicitando materiales para zona:", zoneId);
      const response = await fetchZoneMaterials(zoneId);
      console.log("Respuesta completa de fetchZoneMaterials:", response);
      
      // Examinamos cada capa de la respuesta para entender la estructura
      if (response && response.data) {
        console.log("Contenido de response.data:", response.data);
        
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Inspeccionar cada propiedad del objeto response.data
          Object.keys(response.data).forEach(key => {
            console.log(`Examinando response.data.${key}:`, response.data[key]);
          });
        }
      }
      
      // Intentamos acceder a los datos de diferentes maneras según la estructura de respuesta
      let materialsData = null;
      
      if (response && response.data) {
        // Caso 1: response.data es directamente el array de materiales
        if (Array.isArray(response.data)) {
          materialsData = response.data;
          console.log("Caso 1: response.data es un array");
        } 
        // Caso 2: Los materiales están anidados en una propiedad de response.data
        else if (typeof response.data === 'object') {
          console.log("Caso 2: explorando objeto response.data");
          
          // Revisar las propiedades más comunes donde podrían estar los materiales
          const possiblePaths = ['materials', 'items', 'results', 'data', 'zoneMaterials', 'zonaMateriales', 'materiales'];
          
          for (const path of possiblePaths) {
            if (response.data[path] && Array.isArray(response.data[path])) {
              materialsData = response.data[path];
              console.log(`Encontrado array en response.data.${path}`);
              break;
            }
          }
          
          // Si no encontramos en las rutas comunes, intentamos encontrar cualquier array
          if (!materialsData) {
            for (const key in response.data) {
              if (Array.isArray(response.data[key])) {
                materialsData = response.data[key];
                console.log(`Encontrado array en response.data.${key}`);
                break;
              }
            }
          }
        }
      }
      
      // Si no pudimos encontrar los datos de ninguna manera, establecemos un array vacío
      if (!materialsData) {
        console.error("No se pudo encontrar un array en la respuesta:", response);
        materialsData = [];
      } else {
        // Mostrar el primer elemento para entender su estructura exacta
        if (materialsData.length > 0) {
          console.log("Primer elemento del array de materiales:", materialsData[0]);
          console.log("Todas las claves del primer elemento:", Object.keys(materialsData[0]));
        }
      }
      
      // Transformar los datos para asegurar que tengan la estructura correcta
      const transformedMaterials = materialsData.map(material => {
        // Intenta identificar cada propiedad haciendo log de sus valores
        console.log("Procesando material:", material);
        
        // Buscar propiedades anidadas (por ejemplo, material.material.name)
        let nestedMaterial = null;
        if (material.material && typeof material.material === 'object') {
          console.log("Encontrado objeto anidado 'material':", material.material);
          nestedMaterial = material.material;
        }
        
        console.log("ID:", material.id, material.id_material, material.material_id, nestedMaterial?.id);
        console.log("Nombre:", material.name, material.nombre, material.material_name, nestedMaterial?.name, nestedMaterial?.nombre);
        console.log("Cantidad:", material.quantity, material.cantidad, material.cantidad_disponible, material.cantidad_asignada, material.available_quantity, nestedMaterial?.quantity);
        
        // Extraer la cantidad correctamente, priorizando la cantidad de la zona
        const quantity = 
          // Primero las propiedades directas más probables
          material.cantidad_disponible || 
          material.cantidad_asignada || 
          material.cantidad || 
          material.quantity || 
          material.available_quantity ||
          // Luego propiedades anidadas
          nestedMaterial?.cantidad_disponible ||
          nestedMaterial?.cantidad ||
          nestedMaterial?.quantity ||
          0;
        
        // Material transformado con todas las posibles fuentes de datos
        const transformedMaterial = {
          id: material.id || material.id_material || material.material_id || nestedMaterial?.id || '0',
          name: material.nombre || material.name || material.material_name || nestedMaterial?.name || nestedMaterial?.nombre || 'Material sin nombre',
          quantity: quantity,
          unit: material.unidad || material.unit || material.units || nestedMaterial?.unidad || nestedMaterial?.unit || 'unidades',
          description: material.descripcion || material.description || material.desc || nestedMaterial?.descripcion || nestedMaterial?.description || '',
          raw: material // Guardamos el objeto original para depuración
        };
        
        console.log("Material transformado:", transformedMaterial);
        return transformedMaterial;
      });
      
      console.log("Materiales encontrados (transformados):", transformedMaterials);
      setZoneMaterials(transformedMaterials);
    } catch (error) {
      console.error("Error al cargar materiales de zona:", error);
      handleAuthError(error);
      setZoneMaterials([]);
    }
  };

  // Modificar handleAssignMaterials para usar las nuevas funciones de autenticación
  const handleAssignMaterials = async (data) => {
    try {
      setAuthError(""); // Limpiar errores previos
      console.log("Asignando materiales con datos:", {
        zoneId: parseInt(selectedZone.id),
        materialId: parseInt(data.materialId),
        quantity: parseInt(data.quantity)
      });
      
      await assignMaterialsToZone({
        zoneId: parseInt(selectedZone.id),
        materialId: parseInt(data.materialId),
        quantity: parseInt(data.quantity)
      });

      await loadZoneMaterials(selectedZone.id);
      setShowMaterialAssignmentModal(false);
    } catch (error) {
      console.error("Error al asignar materiales:", error);
      handleAuthError(error);
    }
  };

  // Modificar handleUseMaterials para usar las nuevas funciones de autenticación
  const handleUseMaterials = async (data) => {
    try {
      setAuthError(""); // Limpiar errores previos
      console.log("Registrando uso de materiales con datos:", {
        zoneId: parseInt(selectedZone.id),
        materialId: parseInt(data.materialId),
        quantity: parseInt(data.quantity),
        notes: data.notes
      });
      
      await useMaterialsFromZone({
        zoneId: parseInt(selectedZone.id),
        materialId: parseInt(data.materialId),
        quantity: parseInt(data.quantity),
        notes: data.notes
      });

      await loadZoneMaterials(selectedZone.id);
      setShowUseMaterialsModal(false);
    } catch (error) {
      console.error("Error al registrar uso de materiales:", error);
      handleAuthError(error);
    }
  };

  // Renderizar los botones según el rol
  const renderZoneButtons = (zone) => {
    const buttons = [];

    // Supervisor (roleId = 1)
    if (roleId === 1) {
      buttons.push(
        <Button
          key="assign"
          variant="default"
          size="sm"
          onClick={() => {
            setSelectedZone(zone);
            setShowMaterialAssignmentModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Package size={14} className="mr-1" /> Agregar materiales
        </Button>
      );
    }

    // Botón de eliminar zona (común para todos)
    buttons.push(
      <Button
        key="delete"
        variant="destructive"
        size="sm"
        onClick={() => deleteSavedZone(zone.id)}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        <Trash2 size={14} className="mr-1" /> Eliminar zona
      </Button>
    );

    // Común para todos los roles
    buttons.push(
      <Button
        key="view"
        variant="default"
        size="sm"
        onClick={() => {
          setSelectedZone(zone);
          loadZoneMaterials(zone.id);
          setShowViewMaterialsModal(true);
        }}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <List size={14} className="mr-1" /> Ver materiales
      </Button>
    );

    // Empleado que descuenta materiales (roleId = 3)
    if (roleId === 3) {
      buttons.push(
        <Button
          key="use"
          variant="default"
          size="sm"
          onClick={() => {
            setSelectedZone(zone);
            loadZoneMaterials(zone.id);
            setShowUseMaterialsModal(true);
          }}
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          <FileInput size={14} className="mr-1" /> Registrar uso
        </Button>
      );
    }

    return (
      <div className="flex flex-col space-y-2 mt-2">
        {buttons}
      </div>
    );
  };

  // Al final antes del return, agregaremos el modal que falta
  const renderZoneFormModal = () => {
    return (
      <div className={`fixed inset-0 z-[1000] flex items-center justify-center ${showModal ? "" : "hidden"}`}>
        <div className="absolute inset-0 backdrop-blur-sm bg-black/30" onClick={cancelZoneCreation}></div>
        <div className="relative bg-white rounded-lg w-full max-w-md mx-4 p-6 shadow-xl z-[1001]">
          <h3 className="text-xl font-bold mb-4 text-gray-900">
            {tempZone?.saved ? "Editar zona" : "Crear nueva zona"}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Nombre de la zona*
              </label>
              <input
                type="text"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Ej. Zona Norte"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Descripción
              </label>
              <textarea
                value={zoneForm.description}
                onChange={(e) => setZoneForm({...zoneForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Describe el propósito de esta zona"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                ID del supervisor*
              </label>
              <input
                type="number"
                value={zoneForm.supervisorId}
                onChange={(e) => setZoneForm({...zoneForm, supervisorId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Ej. 1"
                required
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={cancelZoneCreation}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            
            {!tempZone?.saved ? (
              <button
                type="button"
                onClick={handleSaveZone}
                disabled={!zoneForm.name || !zoneForm.supervisorId || loading}
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  !zoneForm.name || !zoneForm.supervisorId || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="inline-block mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Zona"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={confirmTempZone}
                disabled={!zoneForm.name || loading}
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  !zoneForm.name || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="inline-block mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full bg-slate-800/80 text-white border-slate-700/50 hover:border-orange-500/30 transition-colors">
      <CardHeader className="bg-slate-800/80">
        <CardTitle className="flex justify-between items-center text-white">
          <span>Zonas de Trabajo - Pereira</span>
          <div className="flex space-x-2">
            <Button 
              variant={creationMode ? "default" : "outline"}
              size="sm"
              onClick={() => setCreationMode(!creationMode)}
              title={creationMode ? "Cancelar creación" : "Crear nueva zona"}
              className={creationMode 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-slate-700 border-orange-500 text-white hover:bg-slate-600"}
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
      <CardContent className="bg-slate-800/80">
        {creationMode && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
            <p className="flex items-center">
              <Target size={16} className="mr-2" /> 
              <strong>Modo creación activo:</strong> Haz clic en cualquier lugar del mapa para crear una nueva zona de trabajo.
            </p>
          </div>
        )}
        
        {authError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            <p className="flex items-center">
              <span className="mr-2">⚠️</span>
              {authError}
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
                      color: "#FFFFFF",
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">{zone.name}</p>
                        {zone.description && <p className="text-sm">{zone.description}</p>}
                        <p>Radio: {zone.radius || zoneRadius}m</p>
                        {renderZoneButtons(zone)}
                      </div>
                    </Popup>
                  </Circle>
                ))}
                
                {/* Renderizar trabajadores en el mapa */}
                {selectedWorkers.map((worker) => {
                  // Si el trabajador no tiene ubicación, no mostrar marcador
                  if (!worker.location || !worker.location.lat || !worker.location.lng) return null;
                  
                  // Determinar el color del marcador basado en si está en zona
                  const markerColor = worker.inZone ? '#10B981' : '#EF4444'; // Verde o rojo
                  
                  return (
                    <Marker
                      key={worker.id}
                      position={[worker.location.lat, worker.location.lng]}
                      icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="
                          background-color: ${markerColor}; 
                          width: 18px; 
                          height: 18px; 
                          border-radius: 50%; 
                          border: 2px solid white;
                          box-shadow: 0 0 0 2px rgba(255,255,255,0.5);
                        "></div>`,
                        iconSize: [18, 18],
                      })}
                    >
                      <Popup>
                        <div className="p-1">
                          <p className="font-semibold">{worker.name}</p>
                          <p className={worker.inZone ? "text-green-600" : "text-red-600"}>
                            {worker.inZone ? "✅ Dentro de la zona" : "❌ Fuera de la zona"}
                          </p>
                          {worker.zones && worker.zones.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Zonas: {worker.zones.join(', ')}
                            </p>
                          )}
                          <p className="text-xs text-blue-600 mt-1">
                            Ubicación en tiempo real
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
              
              {/* Custom Zoom Controls outside of MapContainer */}
              <div className="absolute top-2 right-2 z-[50] flex flex-col space-y-1">
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
              {!workers || workers.length === 0 ? (
                <div className="bg-orange-100 text-orange-800 p-3 rounded-md text-sm">
                  <p className="font-medium">No hay trabajadores registrados</p>
                  <p className="text-xs mt-1">
                    No se han encontrado registros de trabajadores en el sistema.
                    Pueden estar pendientes de asignación o de registro.
                  </p>
                </div>
              ) : selectedWorkers.length === 0 ? (
                <div className="bg-blue-100 text-blue-800 p-3 rounded-md text-sm">
                  <p className="font-medium">Trabajadores sin ubicación</p>
                  <p className="text-xs mt-1">
                    Hay {workers.length} trabajador(es) registrado(s), pero ninguno tiene datos de ubicación.
                    Es posible que no hayan activado la geolocalización o no estén activos.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mb-2">
                    Mostrando {selectedWorkers.length} de {workers.length} trabajadores
                  </p>
                  <ul className="space-y-2">
                    {selectedWorkers.map((worker) => (
                      <li 
                        key={worker.id || `worker-${worker.name}`} 
                        className={`p-2 rounded-md text-sm ${
                          worker.inZone ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <span className="font-medium">{worker.name}</span>
                        <span className="block text-xs">
                          {worker.inZone ? "✅ Dentro de la zona" : "❌ Fuera de la zona"}
                        </span>
                        {!worker.location && (
                          <span className="block text-xs text-orange-600 mt-1">
                            ⚠️ Sin datos de ubicación
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
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
                  <div className="mt-3 border-t pt-2 border-slate-700">
                    <p className="font-medium mb-1">Ubicación de trabajadores</p>
                    <div className="flex items-center mt-1">
                      <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-white box-content mr-2"></div>
                      <span>Ubicación real (en zona)</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white box-content mr-2"></div>
                      <span>Ubicación real (fuera de zona)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Agregar el modal de creación de zona */}
      {renderZoneFormModal()}
      
      {/* Modales */}
      <MaterialAssignmentModal
        isOpen={showMaterialAssignmentModal}
        onClose={() => setShowMaterialAssignmentModal(false)}
        onAssign={handleAssignMaterials}
        materials={Array.isArray(availableMaterials) ? availableMaterials.map(material => ({
          id: String(material.id || '0'),
          name: material.name || 'Material sin nombre',
          available: material.available || material.quantity || 0,
          description: material.description || '',
          image: material.image_url || ''
        })) : []}
        zoneId={selectedZone?.id ? String(selectedZone.id) : '0'}
      />

      <ViewMaterialsModal
        isOpen={showViewMaterialsModal}
        onClose={() => setShowViewMaterialsModal(false)}
        materials={zoneMaterials}
        zoneName={selectedZone?.name}
      />

      <UseMaterialsModal
        isOpen={showUseMaterialsModal}
        onClose={() => setShowUseMaterialsModal(false)}
        onUse={handleUseMaterials}
        materials={zoneMaterials}
        zoneName={selectedZone?.name}
      />
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