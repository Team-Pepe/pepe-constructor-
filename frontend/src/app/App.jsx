/*

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, Register, ForgotPassword as FPassword } from "@/features/auth";
import Dashboard from "@/pages/Dashboard/dashboard";
import DashboardEmpleados from "@/pages/DashboardWorkers/dashboard-empleados";
import ProtectedRoute from "@/pages/routers/protectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirecciona la ruta raíz a la página de login }
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Página de login }
        <Route path="/login" element={<LoginPage />} />

        {/* Otras rutas }
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<FPassword />} />

        {/* Rutas protegidas }
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard-empleados" element={<DashboardEmpleados />} />
        </Route>
      </Routes>
    </BrowserRouter>

    
  );
}

export default App;
*/