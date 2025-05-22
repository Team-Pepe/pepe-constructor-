import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScan, onError, className, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [permission, setPermission] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // NO iniciar el escáner automáticamente
    // Limpiar el escáner cuando el componente se desmonte
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Error al detener el escáner:", err));
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermission(true);
      return true;
    } catch (error) {
      console.error("Error al solicitar permiso de cámara:", error);
      setPermission(false);
      if (onError) onError("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
      return false;
    }
  };

  const startScanner = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setScanning(true);
    
    try {
      html5QrCodeRef.current = new Html5Qrcode("reader");
      
      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // Procesar el código escaneado para extraer solo el ID
        const userId = extraerIdUsuario(decodedText);
        if (userId && onScan) {
          onScan(userId, decodedResult);
        } else if (onScan) {
          onScan(decodedText, decodedResult);
        }
        stopScanner();
      };
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, 
        config, 
        qrCodeSuccessCallback, 
        (errorMessage) => {
          // Ignoramos errores menores durante el escaneo
          console.log(errorMessage);
        }
      );
    } catch (err) {
      console.error("Error al iniciar el escáner:", err);
      if (onError) onError("Error al iniciar el escáner: " + err.message);
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setScanning(false);
      }).catch(err => {
        console.error("Error al detener el escáner:", err);
        setScanning(false);
      });
    }
  };

  // Función para extraer el ID de usuario (elimina el prefijo "PPC-")
  function extraerIdUsuario(barcode) {
    if (!barcode || typeof barcode !== 'string') {
      return null;
    }
    
    // Verificar si comienza con "PPC-" (insensible a mayúsculas/minúsculas)
    const regex = /^ppc-(\d+)$/i;
    const match = barcode.match(regex);
    
    if (match && match[1]) {
      return match[1]; // Devuelve solo la parte numérica
    }
    
    return barcode; // Si no tiene el formato esperado, devolver el código original
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 ${className || ''}`}>
      <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden w-full max-w-md border border-slate-700">
        {/* Encabezado */}
        <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Escáner de Código de Barras</h3>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full h-8 w-8 p-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
          )}
        </div>
        
        {/* Contenido */}
        <div className="p-4">
          <div className="flex flex-col items-center">
            <div 
              id="reader" 
              ref={scannerRef} 
              className="w-full h-64 bg-slate-700 rounded-md overflow-hidden"
            ></div>
            
            <div className="mt-4 flex gap-2">
              {!scanning ? (
                <Button 
                  onClick={startScanner} 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Iniciar Escáner
                </Button>
              ) : (
                <Button 
                  onClick={stopScanner} 
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600"
                >
                  Detener Escáner
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { BarcodeScanner };
export default BarcodeScanner;