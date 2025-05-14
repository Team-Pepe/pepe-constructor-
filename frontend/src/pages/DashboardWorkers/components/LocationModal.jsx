import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";

export const LocationModal = ({
  showLocationModal,
  setShowLocationModal,
  locationStatus,
  locationPermissionDenied,
  locationLoading,
  requestLocationPermission,
  workerLocation
}) => {
  if (!showLocationModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
      <div className="bg-black border-2 border-gray-700 p-6 rounded-lg max-w-md w-full shadow-xl">
        <div className="flex items-center justify-center text-white mb-4">
          <MapPin size={48} />
        </div>
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Acceso a ubicación requerido
        </h2>
        <p className="text-gray-300 mb-6 text-center">
          Para poder utilizar el sistema correctamente, necesitamos acceder a tu ubicación. 
          Esto nos permite ubicarte en el mapa de trabajo y gestionar la asignación de tareas.
        </p>
        
        {locationStatus && (
          <div className={`p-4 mb-4 rounded-md ${
            locationStatus.includes('Error') 
              ? 'bg-red-800 border border-red-600 text-red-300' 
              : locationStatus.includes('no pudo guardar')
                ? 'bg-gray-700 border border-gray-600 text-gray-300'
                : 'bg-gray-700 border border-gray-600 text-gray-300'
          }`}>
            <p className="text-sm">
              {locationStatus}
            </p>
          </div>
        )}
        
        {locationPermissionDenied && (
          <div className="bg-red-800 border border-red-600 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" size={20} />
              <p className="text-red-300 text-sm">
                Has rechazado el permiso de ubicación. Por favor, habilita los permisos de ubicación en la configuración de tu navegador y recarga la página.
              </p>
            </div>
          </div>
        )}
        
        {/* If there is a server error but location was obtained */}
        {locationStatus && locationStatus.includes('no pudo guardar') && workerLocation && (
          <div className="bg-gray-700 border border-gray-600 rounded-md p-4 mb-4">
            <p className="text-gray-300 text-sm">
              ✅ Ubicación obtenida con éxito: Se usará localmente en el mapa.
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          <Button 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3"
            onClick={requestLocationPermission}
            disabled={locationLoading || locationPermissionDenied}
            size="lg"
          >
            {locationLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Obteniendo ubicación...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-5 w-5" />
                {locationStatus && locationStatus.includes('Error') 
                  ? 'Intentar de nuevo' 
                  : 'Permitir acceso a ubicación'}
              </>
            )}
          </Button>
          
          {/* Allow continuing even if there are backend errors but location is available */}
          {(locationPermissionDenied || (locationStatus && locationStatus.includes('servidor') && workerLocation)) && (
            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => setShowLocationModal(false)}
            >
              Continuar {workerLocation ? 'con ubicación local' : 'sin ubicación'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 