import { useState, useRef, useEffect } from "react";
import { registerCheckIn } from "@/services/dashboardService";

export const useCheckInStatus = ({ workerLocation, savedZones }) => {
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [selectedCheckInZone, setSelectedCheckInZone] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);
  
  // Handle check-in process
  const handleCheckIn = async () => {
    if (!selectedCheckInZone) {
      setCheckInStatus('Debes seleccionar una zona de trabajo');
      return;
    }

    if (!navigator.geolocation) {
      setCheckInStatus('Tu navegador no soporta geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use the complete zone object
          const selectedZone = selectedCheckInZone;

          // Calculate distance between worker and zone center
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

          // Activate camera to take photo
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
        }
      },
      (error) => {
        console.error('Error al obtener ubicación:', error);
        setCheckInStatus('Error al obtener ubicación. Verifica los permisos.');
      }
    );
  };
  
  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance * 1000; // Convert to meters
  };
  
  // Take picture for check-in
  const takePicture = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedCheckInZone) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions according to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame on canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      
      // Ensure we have a numeric zone ID
      if (!selectedCheckInZone.id || isNaN(parseInt(selectedCheckInZone.id))) {
        throw new Error('ID de zona inválido');
      }

      // Ensure we have valid coordinates
      if (!workerLocation || !workerLocation.lat || !workerLocation.lng || 
          isNaN(parseFloat(workerLocation.lat)) || isNaN(parseFloat(workerLocation.lng))) {
        throw new Error('Coordenadas inválidas');
      }
      
      // Create object with check-in data in the required format
      const checkInData = {
        zoneId: selectedCheckInZone.id,
        latitude: workerLocation.lat.toString(),
        longitude: workerLocation.lng.toString(),
        photo: blob
      };

      // Register check-in
      await registerCheckIn(checkInData);
      setCheckInStatus('Check-in registrado exitosamente');
      
      // Clean up
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
  
  return {
    checkInStatus,
    setCheckInStatus,
    selectedCheckInZone,
    setSelectedCheckInZone,
    cameraStream,
    setCameraStream,
    showCamera,
    setShowCamera,
    videoRef,
    canvasRef,
    handleCheckIn,
    takePicture
  };
}; 