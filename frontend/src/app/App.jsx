import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, Register, ForgotPassword as FPassword } from "@/features/auth";
import Dashboard from "@/components/dashboard/dashboard";
import DashboardEmpleados from "@/components/dashboard-empleados/dashboard-empleados"; // Importa el nuevo componente

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirecciona la ruta raíz a la página de login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Página de login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Otras rutas */}
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<FPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard-empleados" element={<DashboardEmpleados />} /> {/* Nueva ruta */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;