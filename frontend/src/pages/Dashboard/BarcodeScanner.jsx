import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

const BarcodeScanner = ({ onScan, onError, className, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [permission, setPermission] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
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
    setScanSuccess(false);
    
    try {
      html5QrCodeRef.current = new Html5Qrcode("reader");
      
      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // Procesar el código escaneado para extraer solo el ID
        const userId = extraerIdUsuario(decodedText);
        
        // Mostrar animación de éxito
        setScanSuccess(true);
        
        // Esperar un momento para que se vea la animación antes de cerrar
        setTimeout(() => {
          if (userId && onScan) {
            onScan(userId, decodedResult);
          } else if (onScan) {
            onScan(decodedText, decodedResult);
          }
          stopScanner();
        }, 1500); // Esperar 1.5 segundos para mostrar la animación
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

  // Variantes de animación para el modal
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const modalVariants = {
    hidden: { 
      scale: 0.8, 
      opacity: 0,
      y: 20
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
        delay: 0.1
      }
    },
    exit: { 
      scale: 0.8, 
      opacity: 0,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  // Variantes para el escáner
  const scannerVariants = {
    idle: {
      opacity: 1,
      scale: 1
    },
    scanning: {
      opacity: 1,
      scale: 1,
      boxShadow: [
        "0 0 0 0px rgba(255, 165, 0, 0)",
        "0 0 0 4px rgba(255, 165, 0, 0.3)",
        "0 0 0 8px rgba(255, 165, 0, 0)"
      ],
      transition: {
        repeat: Infinity,
        duration: 1.5
      }
    }
  };

  // Variantes para el botón
  const buttonVariants = {
    hover: { 
      scale: 1.05,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
  };

  // Variantes para la animación de éxito
  const successVariants = {
    hidden: { 
      scale: 0.5, 
      opacity: 0 
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 200
      }
    },
    exit: { 
      scale: 1.5, 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 ${className || ''}`}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
      >
        <motion.div 
          className="bg-slate-800 rounded-lg shadow-xl overflow-hidden w-full max-w-md border border-slate-700"
          variants={modalVariants}
        >
          {/* Encabezado */}
          <motion.div 
            className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-bold text-white">Escáner de Código de Barras</h3>
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full h-8 w-8 p-0 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </motion.button>
            )}
          </motion.div>
          
          {/* Contenido */}
          <div className="p-4">
            <div className="flex flex-col items-center">
              <div className="relative w-full">
                <motion.div 
                  id="reader" 
                  ref={scannerRef} 
                  className="w-full h-64 bg-slate-700 rounded-md overflow-hidden"
                  variants={scannerVariants}
                  animate={scanning ? "scanning" : "idle"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: 0.3 }}
                />
                
                {/* Animación de éxito */}
                <AnimatePresence>
                  {scanSuccess && (
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center bg-green-500/80 rounded-md"
                      variants={successVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="flex flex-col items-center">
                        <motion.div 
                          className="text-white bg-green-600 rounded-full p-4 mb-2"
                          initial={{ rotate: -90, scale: 0.5 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.1 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </motion.div>
                        <motion.p 
                          className="text-white font-bold text-xl"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          ¡Escaneado con éxito!
                        </motion.p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.div 
                className="mt-4 flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <AnimatePresence mode="wait">
                  {!scanning ? (
                    <motion.button 
                      key="start"
                      onClick={startScanner} 
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Iniciar Escáner
                    </motion.button>
                  ) : (
                    <motion.button 
                      key="stop"
                      onClick={stopScanner} 
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Detener Escáner
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export { BarcodeScanner };
export default BarcodeScanner;