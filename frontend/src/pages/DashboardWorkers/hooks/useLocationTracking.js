import { useState, useEffect } from "react";
import { updateUserLocation } from "@/services/dashboardService";

export const useLocationTracking = () => {
  const [workerLocation, setWorkerLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [locationStatus, setLocationStatus] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Show location modal on initial load
  useEffect(() => {
    setShowLocationModal(true);
  }, []);

  // Clean up location interval on unmount
  useEffect(() => {
    let locationInterval;
    
    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, []);

  // Function to request location permission
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
          
          // Update location in local state
          setWorkerLocation({
            lat: latitude,
            lng: longitude
          });

          // Send location to backend
          try {
            await updateUserLocation({ latitude, longitude });
            
            // Update state and close modal
            setLocationStatus('Ubicación actualizada correctamente');
            setShowLocationModal(false);
            
            // Set up interval to update location every 5 minutes
            const interval = setInterval(() => updateLocation(), 5 * 60 * 1000);
            return () => clearInterval(interval);
          } catch (apiError) {
            console.error('Error al llamar a la API:', apiError);
            
            // Show specific error message but allow the user to continue using the app
            if (apiError.response?.status === 500) {
              setLocationStatus('El servidor no pudo guardar tu ubicación, pero seguirás viendo el mapa. Por favor, contacta al administrador.');
              // Despite the error, close the modal after a few seconds to avoid blocking the user
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
        
        // Mark that permission was denied
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermissionDenied(true);
        }
        
        // Custom messages based on error
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

  // Function to periodically update location
  const updateLocation = () => {
    if (!navigator.geolocation || locationPermissionDenied) return;
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Update location in local state
          setWorkerLocation({
            lat: latitude,
            lng: longitude
          });

          // Send location to backend
          try {
            await updateUserLocation({ latitude, longitude });
            console.log('Ubicación actualizada en segundo plano');
          } catch (apiError) {
            console.error('Error al actualizar ubicación:', apiError);
          }
        } catch (error) {
          console.error('Error al procesar ubicación periódica:', error);
        }
      },
      (error) => {
        console.error('Error al obtener ubicación en segundo plano:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return {
    workerLocation,
    setWorkerLocation,
    showLocationModal,
    setShowLocationModal,
    locationStatus,
    locationPermissionDenied,
    locationLoading,
    requestLocationPermission,
    updateLocation
  };
}; 