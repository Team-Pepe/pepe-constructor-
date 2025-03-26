import React, { useState } from "react";
import ZonasDeTrabajo from "./zonas-de-trabajo";
import SolicitarMateriales from "./solicitar-materiales";

function DashboardEmpleados() {
  const [activeSection, setActiveSection] = useState(null); // Estado para controlar la sección activa
  const [selectedZone, setSelectedZone] = useState(null); // Estado para controlar la zona seleccionada

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Menú lateral */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Menú</h1>
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

        {!activeSection && !selectedZone && (
          <div className="text-center text-gray-500">
            <p>Selecciona una opción del menú para comenzar.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardEmpleados;