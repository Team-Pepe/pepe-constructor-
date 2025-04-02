import React, { useState, useEffect } from "react";
import ZonasDeTrabajo from "./zonas-de-trabajo";
import SolicitarMateriales from "./solicitar-materiales";
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

  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";

  // Establecer ubicación fija del trabajador actual
  useEffect(() => {
    // Ubicación fija en Pereira
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
        // Intentar cargar desde la API
        const response = await axios.get(`${apiEndpoint}/api/workzones`);
        if (response.data) {
          setSavedZones(response.data);
        }
      } catch (error) {
        console.error("Error al cargar zonas de trabajo desde API:", error);

        // Si la API falla, cargar desde localStorage
        const savedZonesFromStorage = localStorage.getItem("workZones");
        if (savedZonesFromStorage) {
          try {
            const zones = JSON.parse(savedZonesFromStorage);
            setSavedZones(zones);
            console.log("Zonas de trabajo cargadas desde localStorage:", zones);
          } catch (parseError) {
            console.error("Error al parsear zonas de trabajo desde localStorage:", parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    // Cargar zonas al iniciar y cada vez que se activa la sección correspondiente
    fetchSavedZones();

    // Configurar un intervalo para actualizar periódicamente
    const interval = setInterval(fetchSavedZones, 30000); // cada 30 segundos

    return () => clearInterval(interval);
  }, [apiEndpoint]);

  // Crear un objeto de trabajador para el usuario actual
  const currentWorker = workerLocation
    ? [
        {
          id: "current",
          name: "Mi ubicación",
          location: workerLocation,
          inZone: false, // Se actualizará automáticamente en el componente
        },
      ]
    : [];

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `url(${fondo2})`, // 👈 Aplicamos la imagen de fondo
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        height: "100vh",
      }}
    >
      {/* Menú lateral */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Menú</h1>
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
          {/* Botón de Inicio */}
          <button
            onClick={() => {
              setActiveSection(null);
              setSelectedZone(null); // Restablece la zona seleccionada
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === null && !selectedZone ? "bg-gray-100" : ""
            }`}
          >
            Inicio
          </button>

          {/* Botón de Zonas de Trabajo */}
          <button
            onClick={() => {
              setActiveSection("zonas-de-trabajo");
              setSelectedZone(null); // Restablece la zona seleccionada
            }}
            className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded ${
              activeSection === "zonas-de-trabajo" ? "bg-gray-100" : ""
            }`}
          >
            Zonas de Trabajo
          </button>

          {/* Botón para el mapa */}
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

          {/* Botón para zonas guardadas */}
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
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        {activeSection === "zonas-de-trabajo" && !selectedZone && (
          <section id="zonas-de-trabajo">
            <h2 className="text-2xl font-bold mb-4">Zonas de Trabajo</h2>
            <ZonasDeTrabajo onSelectZone={(zone) => setSelectedZone(zone)} />
          </section>
        )}

        {selectedZone && (
          <section id="solicitar-materiales">
            <h2 className="text-2xl font-bold mb-4">Solicitar Materiales - {selectedZone}</h2>
            <SolicitarMateriales />
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
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div>
                            <span className="font-semibold">Latitud:</span>{" "}
                            {zone.lat ? zone.lat.toFixed(6) : zone.latitud?.toFixed(6)}
                          </div>
                          <div>
                            <span className="font-semibold">Longitud:</span>{" "}
                            {zone.lng ? zone.lng.toFixed(6) : zone.longitud?.toFixed(6)}
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setActiveSection("mapa");
                            // Aquí podrías pasar la zona seleccionada al mapa
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