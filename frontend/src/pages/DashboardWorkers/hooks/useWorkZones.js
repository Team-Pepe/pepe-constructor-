import { useState, useEffect } from "react";
import axios from "axios";

export const useWorkZones = () => {
  const [savedZones, setSavedZones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";
    
    const fetchSavedZones = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${apiEndpoint}/api/work-zones`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
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
        // Fallback to localStorage if API fails
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
    
    // Setup polling interval to refresh data
    const interval = setInterval(fetchSavedZones, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return { savedZones, loading };
}; 