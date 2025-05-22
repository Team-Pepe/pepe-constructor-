import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, MapPinned, AlertTriangle, Loader2, Check, Camera, X, Info, Clock } from "lucide-react";

export const CheckInSection = ({
  selectedCheckInZone,
  setSelectedCheckInZone,
  savedZones,
  checkInStatus,
  handleCheckIn,
  locationLoading,
  showCamera,
  videoRef,
  canvasRef,
  takePicture,
  cameraStream,
  setShowCamera,
  setCameraStream
}) => {
  return (
    <motion.section 
      id="check-in" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          type: "spring",
          damping: 25,
          stiffness: 300
        }
      }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <motion.h2 
            className="text-2xl font-bold mb-4 px-4 py-2 bg-slate-800/90 rounded-lg text-white inline-block flex items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.3,
                ease: "easeOut"
              }
            }}
          >
            <Calendar className="mr-2 h-6 w-6 text-orange-400 animate-pulse" />
            Check In
          </motion.h2>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 p-6">
            <div className="flex items-center space-x-4 mb-6 bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Registro de Entrada</h3>
                <p className="text-slate-400">Asegúrate de estar dentro de una zona de trabajo válida</p>
              </div>
            </div>

            {!showCamera ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Selecciona tu zona de trabajo
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCheckInZone?.name || selectedCheckInZone || ''}
                      onChange={(e) => {
                        const zoneName = e.target.value;
                        if (!zoneName) {
                          setSelectedCheckInZone(null);
                        } else {
                          const zoneObj = savedZones.find(zone => zone.name === zoneName);
                          if (zoneObj) {
                            setSelectedCheckInZone(zoneObj);
                          }
                        }
                      }}
                      className="w-full p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Selecciona una zona</option>
                      {savedZones.map((zone) => (
                        <option key={zone.id} value={zone.name}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <MapPinned className="h-5 w-5 text-slate-500" />
                    </div>
                  </div>
                </div>

                {checkInStatus && (
                  <div className={`p-4 mb-6 rounded-lg border transition-all duration-300 animate-slideIn ${
                    checkInStatus.includes('exitosamente') 
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-red-500/20 border-red-500/50 text-red-400'
                  }`}>
                    <div className="flex items-start space-x-3">
                      {checkInStatus.includes('exitosamente') ? (
                        <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="h-4 w-4 text-green-400" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        </div>
                      )}
                      <p>{checkInStatus}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCheckIn}
                  className={`w-full h-12 relative overflow-hidden group ${
                    locationLoading || !selectedCheckInZone
                      ? 'bg-slate-700 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600'
                  } text-white transition-all duration-300`}
                  disabled={locationLoading || !selectedCheckInZone}
                >
                  <div className="absolute inset-0 w-full h-full transition-all duration-300 scale-x-0 group-hover:scale-x-100 group-hover:bg-orange-600/50" />
                  <span className="relative flex items-center justify-center">
                    {locationLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verificando ubicación...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-5 w-5 animate-bounce" />
                        Registrar Check In
                      </>
                    )}
                  </span>
                </Button>

                {!locationLoading && !selectedCheckInZone && (
                  <p className="mt-4 text-sm text-slate-400 text-center animate-pulse">
                    👆 Selecciona una zona para continuar
                  </p>
                )}
              </>
            ) : (
              <div className="relative animate-fadeIn">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient"></div>
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg mb-4 border-2 border-slate-700/50"
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={takePicture}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Tomar Foto</span>
                    </Button>
                    <Button
                      onClick={() => {
                        if (cameraStream) {
                          cameraStream.getTracks().forEach(track => track.stop());
                        }
                        setCameraStream(null);
                        setShowCamera(false);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105"
                    >
                      <X className="h-5 w-5" />
                      <span>Cancelar</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 h-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Info className="mr-2 h-5 w-5 text-orange-400" />
              Información de Check In
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <h4 className="text-orange-400 font-medium mb-2">Horario Laboral</h4>
                <div className="flex items-center space-x-3 text-slate-300">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>7:00 AM - 4:00 PM</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <h4 className="text-orange-400 font-medium mb-2">Estado Actual</h4>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400">En horario laboral</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <h4 className="text-orange-400 font-medium mb-2">Información</h4>
                <p className="text-slate-300 text-sm">
                  Realiza tu check-in al llegar a tu zona de trabajo asignada.
                  Asegúrate de estar físicamente dentro del área designada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};