import React from "react";
import { ConstructionWorkerCard } from "../../Dashboard/components/ConstructionWorkerCard";
import { 
  Home, Calendar, Map, MapPin, MapPinned, Warehouse, Package, LogOut
} from "lucide-react";

export const SideMenu = ({
  menuOpen,
  user,
  activeSection,
  setActiveSection,
  setSelectedZone,
  canRequestMaterials,
  navigate,
  logout
}) => {
  return (
    <aside
      className={`w-64 bg-white shadow-md flex flex-col justify-between overflow-y-auto transform ${
        menuOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 fixed h-full z-40`}
    >
      <div>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800"></h1>
        </div>

        {/* Employee card */}
        <div className="p-4">
          <ConstructionWorkerCard
            name={user?.username || "Usuario"}
            id={user?.id?.toString() || "N/A"}
            role={
              user?.roleId === 1 ? "Supervisor" :
              user?.roleId === 2 ? "Trabajador" :
              user?.roleId === 3 ? "Jefe de Obra" :
              user?.roleId === 4 ? "Admin" : "Trabajador"
            }
            bloodType={user?.bloodType || "N/A"}
          />
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => {
              setActiveSection(null);
              setSelectedZone(null);
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === null && !setSelectedZone ? "bg-gray-100" : ""
            } flex items-center`}
          >
            <Home className="mr-2 h-4 w-4" />
            Inicio
          </button>

          <button
            onClick={() => {
              setActiveSection("check-in");
              setSelectedZone(null);
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === "check-in" ? "bg-gray-100" : ""
            } flex items-center`}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Check In
          </button>

          <button
            onClick={() => {
              setActiveSection("zonas-de-trabajo");
              setSelectedZone(null);
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === "zonas-de-trabajo" ? "bg-gray-100" : ""
            } flex items-center`}
          >
            <Map className="mr-2 h-4 w-4" />
            Zonas de Trabajo
          </button>

          <button
            onClick={() => {
              setActiveSection("mapa");
              setSelectedZone(null);
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === "mapa" ? "bg-gray-100" : ""
            } flex items-center`}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Mi Ubicación
          </button>

          <button
            onClick={() => {
              setActiveSection("zonas-guardadas");
              setSelectedZone(null);
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === "zonas-guardadas" ? "bg-gray-100" : ""
            } flex items-center`}
          >
            <MapPinned className="mr-2 h-4 w-4" />
            Zonas Guardadas
          </button>

          <button
            onClick={() => {
              setActiveSection("inventario");
              setSelectedZone(null);
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === "inventario" ? "bg-gray-100" : ""
            } flex items-center`}
          >
            <Warehouse className="mr-2 h-4 w-4" />
            Inventario
          </button>

          {canRequestMaterials && (
            <button
              onClick={() => {
                navigate("/solicitar-materiales");
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded flex items-center bg-blue-50`}
            >
              <Package className="mr-2 h-4 w-4" />
              Solicitar Materiales
            </button>
          )}

          <button
            onClick={() => setActiveSection("mi-asistencia")}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === "mi-asistencia" ? "bg-gray-100" : ""
            } flex items-center`}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Mi Asistencia
          </button>
        </nav>
      </div>

      <div className="p-4">
        <button
          onClick={() => {
            logout(); // Clean the context and storage
            navigate("/login"); // Redirect to login
          }}
          className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded flex items-center`}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}; 