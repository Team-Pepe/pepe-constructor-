import React, { useState, useEffect } from "react";
import ZonasDeTrabajo from "./zonas-de-trabajo";
import Inventario from "./inventario";
import EmployeeMap from "@/components/ui/EmployeeMap/EmployeeMap"; // Importamos el nuevo componente
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmployeeCard } from "../Dashboard/components";
import axios from "axios";
import fondo2 from "../../assets/fondo2.jpg"; // 👈 Importamos la imagen de fondo

function DashboardEmpleados() {
  const [activeSection, setActiveSection] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [workerLocation, setWorkerLocation] = useState(null);
  const [savedZones, setSavedZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Estado para controlar si el menú está abierto o cerrado

  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";

  // Establecer ubicación fija del trabajador actual
  useEffect(() => {
    setWorkerLocation({
      lat: 4.8133,
      lng: -75.6961,
    });
  }, []);

  // Cargar zonas de trabajo guardadas
  useEffect(() => {
    const fetchSavedZones = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken"); // Obtener token
        const response = await axios.get(`${apiEndpoint}/api/work-zones`, {
          headers: {
            Authorization: `Bearer ${token}` // Añadir header de autenticación
          },
          withCredentials: true // Permitir cookies
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
    const interval = setInterval(fetchSavedZones, 30000);
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  const currentWorker = workerLocation
    ? [
        {
          id: "current",
          name: "Mi ubicación",
          location: workerLocation,
          inZone: false,
        },
      ]
    : [];

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `url(${fondo2})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        height: "100vh",
      }}
    >
      {/* Botón para abrir/cerrar el menú */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-2 left-4 z-50 bg-gray-800 text-white px-4 py-1 rounded-md shadow-md"
      >
        {menuOpen ? "×" : "☰"}
      </button>

      {/* Menú lateral */}
      <aside
        className={`w-64 bg-white shadow-md flex flex-col justify-between overflow-y-auto transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 fixed h-full z-40`}
      >
        <div>
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800"></h1>
          </div>

          {/* Carnet de empleado */}
          <div className="p-4">
            <EmployeeCard
              name="Juan Pérez"
              email="juan.perez@pepe.com"
              role="Trabajador de Obra"
            />
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => {
                setActiveSection(null);
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === null && !selectedZone ? "bg-gray-100" : ""
              }`}
            >
              Inicio
            </button>

            <button
              onClick={() => {
                setActiveSection("zonas-de-trabajo");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "zonas-de-trabajo" ? "bg-gray-100" : ""
              }`}
            >
              Zonas de Trabajo
            </button>

            <button
              onClick={() => {
                setActiveSection("mapa");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "mapa" ? "bg-gray-100" : ""
              }`}
            >
              Mi Ubicación
            </button>

            <button
              onClick={() => {
                setActiveSection("zonas-guardadas");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "zonas-guardadas" ? "bg-gray-100" : ""
              }`}
            >
              Zonas Guardadas
            </button>

            <button
              onClick={() => {
                setActiveSection("inventario");
                setSelectedZone(null);
              }}
              className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
                activeSection === "inventario" ? "bg-gray-100" : ""
              }`}
            >
              Inventario
            </button>
          </nav>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              console.log("Cerrar sesión");
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === "inventario" ? "bg-gray-100" : ""
            }`}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          menuOpen ? "ml-64" : "ml-0"
        }`}
      >
        {activeSection === "zonas-de-trabajo" && !selectedZone && (
          <section id="zonas-de-trabajo">
            <h2 className="text-2xl font-bold mb-4">Zonas de Trabajo</h2>
            <ZonasDeTrabajo onSelectZone={(zone) => setSelectedZone(zone)} />
          </section>
        )}

        {selectedZone && (
          <section id="solicitar-materiales">
            <h2 className="text-2xl font-bold mb-4">Solicitar Materiales - {selectedZone}</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="mb-4">
                Para solicitar materiales para la zona <strong>{selectedZone}</strong>, por favor
                utilice la sección de Inventario y seleccione esta zona en el formulario.
              </p>
              <Button onClick={() => setActiveSection("inventario")} className="w-full">
                Ir a Inventario
              </Button>
            </div>
          </section>
        )}

        {activeSection === "mapa" && (
          <section id="mapa-ubicacion">
            <h2 className="text-2xl font-bold mb-4">Mi Ubicación en Mapa</h2>
            <EmployeeMap
              workers={currentWorker}
              defaultCenter={[workerLocation?.lat || 4.8133, workerLocation?.lng || -75.6961]}
              defaultZoom={15}
              savedZones={savedZones}
            />
          </section>
        )}

        {activeSection === "zonas-guardadas" && (
          <section id="zonas-guardadas">
            <h2 className="text-2xl font-bold mb-4">Zonas de Trabajo Guardadas</h2>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedZones.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-center">No hay zonas de trabajo guardadas.</p>
                ) : (
                  savedZones.map((zone) => (
                    <Card key={zone.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-2">
                          {zone.description || "Sin descripción"}
                        </p>
                        // En el renderizado de tarjetas de zonas:
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div>
                            <span className="font-semibold">Latitud:</span>{" "}
                            {zone.lat?.toFixed(6) || zone.latitud?.toFixed(6)}
                          </div>
                          <div>
                            <span className="font-semibold">Longitud:</span>{" "}
                            {zone.lng?.toFixed(6) || zone.longitud?.toFixed(6)}
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setActiveSection("mapa");
                          }}
                          className="mt-4 w-full"
                        >
                          Ver en mapa
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </section>
        )}

        {activeSection === "inventario" && (
          <section id="inventario">
            <h2 className="text-2xl font-bold mb-4">Inventario de Materiales</h2>
            <Inventario />
          </section>
        )}

        {!activeSection && !selectedZone && (
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
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardEmpleados;