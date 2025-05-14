import React from "react";

export const DashboardHome = ({ setActiveSection, canRequestMaterials, navigate }) => {
  return (
    <div className="text-center mt-40">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Bienvenido al Panel de Empleados</h3>
        <div className="text-gray-600 mb-6">
          <p>Selecciona una opción del menú para empezar:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setActiveSection("mapa")}
            className="p-4 border rounded-md cursor-pointer hover:bg-blue-50"
          >
            <h4 className="font-medium text-black-700">Mi Ubicación</h4>
            <p className="text-sm text-gray-500">Ver tu ubicación actual en el mapa y zonas cercanas</p>
          </div>

          <div
            onClick={() => setActiveSection("zonas-guardadas")}
            className="p-4 border rounded-md cursor-pointer hover:bg-blue-50"
          >
            <h4 className="font-medium text-black-700">Zonas Guardadas</h4>
            <p className="text-sm text-gray-500">Ver todas las zonas de trabajo asignadas</p>
          </div>

          {canRequestMaterials && (
            <div
              onClick={() => navigate("/solicitar-materiales")}
              className="p-4 border rounded-md cursor-pointer hover:bg-blue-50 mt-4 bg-blue-100 border-blue-300 col-span-2"
            >
              <h4 className="font-medium text-black-700">Solicitar Materiales</h4>
              <p className="text-sm text-gray-500">Realiza solicitudes de materiales para tu zona de trabajo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 