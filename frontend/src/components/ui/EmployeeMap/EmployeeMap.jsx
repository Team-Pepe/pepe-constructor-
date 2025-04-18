import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import PropTypes from "prop-types";
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

// Actualizar la definición del componente
function EmployeeMap({ 
  workers = [], 
  defaultCenter = [4.8133, -75.6961], 
  defaultZoom = 13, 
  savedZones = []  // Parámetro por defecto aquí
}) {
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  // Función para verificar si un trabajador está dentro de una zona
  const checkWorkersInZones = () => {
    // Validar estructura de datos antes de procesar
    if (!workers || workers.length === 0 || !savedZones || savedZones.length === 0) {
      return workers ? workers.map(worker => ({ ...worker, inZone: false })) : [];
    }

    return workers
      .filter(worker => worker?.location && worker.location.lat && worker.location.lng)
      .map(worker => {
        const point = L.latLng(worker.location.lat, worker.location.lng);

        const isInSavedZone = savedZones.some(zone => {
          // Validar estructura de la zona
          if (!zone?.lat || !zone?.lng) return false;
          
          const center = L.latLng(zone.lat, zone.lng);
          const distance = point.distanceTo(center);
          return distance <= (zone.radius || 500);
        });

        return {
          ...worker,
          inZone: isInSavedZone,
        };
      });
  };

  // Actualizar los trabajadores cuando cambian las zonas
  useEffect(() => {
    setSelectedWorkers(checkWorkersInZones());
  }, [savedZones, workers]);

  return (
    <div className="w-full h-[600px] rounded-md overflow-hidden border relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        zoomControl={true}
      >
        {/* Estilo de mapa oscuro */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Renderizar zonas guardadas en la base de datos */}
        // Modificar el mapeo de zonas en el renderizado
        {savedZones.map((zone) => {
          if (!zone.lat || !zone.lng) { // Cambiar !zone.lat repetido por !zone.lng
            console.warn('Zona inválida:', zone);
            return null;
          }
          
          return (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius || 500}
              pathOptions={{
                fillColor: "#10B981",
                fillOpacity: 0.4,
                color: "#FFFFFF",
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{zone.name}</p>
                  {zone.description && <p className="text-sm">{zone.description}</p>}
                  <p>Radio: {zone.radius || 500}m</p>
                </div>
              </Popup>
            </Circle>
          );  // <-- Faltaba este punto y coma y paréntesis de cierre
        })}
        {/* Renderizar trabajadores en el mapa */}
        {selectedWorkers.map((worker) => {
          if (!worker.location) return null;

          return (
            <Marker
              key={worker.id}
              position={[worker.location.lat, worker.location.lng]}
              icon={L.divIcon({
                className: "custom-div-icon",
                html: `<div style="
                  background-color: ${worker.inZone ? "#10B981" : "#EF4444"}; 
                  width: 20px; 
                  height: 20px; 
                  border-radius: 50%; 
                  border: 3px solid white;
                  box-shadow: 0 0 0 2px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-semibold text-md">{worker.name}</p>
                  <p className={worker.inZone ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {worker.inZone ? "✅ Dentro de la zona" : "❌ Fuera de la zona"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ubicación en tiempo real
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

EmployeeMap.propTypes = {
  workers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      location: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired,
      }),
    })
  ),
  defaultCenter: PropTypes.arrayOf(PropTypes.number),
  defaultZoom: PropTypes.number,
  savedZones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      lat: PropTypes.number, // Cambiar a no requerido temporalmente
      lng: PropTypes.number, // Cambiar a no requerido
      name: PropTypes.string,
      description: PropTypes.string,
      radius: PropTypes.number,
    })
  ),
};

// Eliminar esta sección al final del archivo:
// EmployeeMap.defaultProps = {
//   savedZones: []
// };

export default EmployeeMap;
