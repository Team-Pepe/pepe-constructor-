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

function EmployeeMap({ workers = [], defaultCenter = [4.8133, -75.6961], defaultZoom = 13, savedZones = [] }) {
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  // Función para verificar si un trabajador está dentro de una zona
  const checkWorkersInZones = () => {
    if (!workers || workers.length === 0 || savedZones.length === 0) {
      return workers ? workers.map(worker => ({ ...worker, inZone: false })) : [];
    }

    return workers.map(worker => {
      if (!worker.location) return { ...worker, inZone: false };

      const point = L.latLng(worker.location.lat, worker.location.lng);

      // Verificar si el trabajador está en alguna zona guardada
      const isInSavedZone = savedZones.some(zone => {
        const center = L.latLng(zone.lat, zone.lng);
        const distance = point.distanceTo(center);
        return distance <= (zone.radius || 500); // Radio por defecto: 500m
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
        {savedZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius || 500}
            pathOptions={{
              fillColor: "#10B981",
              fillOpacity: 0.4,
              color: "#FFFFFF", // Borde blanco
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
        ))}

        {/* Renderizar trabajadores en el mapa */}
        {selectedWorkers.map((worker) => {
          if (!worker.location) return null;

          return (
            <Marker
              key={worker.id}
              position={[worker.location.lat, worker.location.lng]}
              icon={L.divIcon({
                className: "custom-div-icon",
                html: `<div style="background-color: ${worker.inZone ? "#10B981" : "#EF4444"}; 
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
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      name: PropTypes.string,
      description: PropTypes.string,
      radius: PropTypes.number,
    })
  ),
};

export default EmployeeMap;