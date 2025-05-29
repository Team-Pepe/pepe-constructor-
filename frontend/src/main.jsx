import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, redirect } from "react-router-dom";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginPage, Register, ForgotPassword as FPassword } from "@/features/auth";
import ResetPassword from "@/features/auth/reset-password";
import Dashboard from "@/pages/Dashboard/dashboard";
import { DashboardEmpleados } from "@/pages/DashboardWorkers/dashboard-empleados";
import SolicitarMateriales from "@/pages/DashboardWorkers/solicitar-materiales";
import ProtectedRoute from "@/pages/routers/protectedRoute";
import TaskList from "@/pages/DashboardWorkers/components/TaskList"; // Asegúrate de que la ruta de importación sea correcta

import "./styles/global.css";

// Configuración de rutas con manejo de errores y redirección correcta
const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/login"),
    errorElement: <h1>Error cargando la página</h1>,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <FPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
        handle: { requiredRole: [1, 4] }
      },
      {
        path: "dashboard-empleados",
        element: <DashboardEmpleados />,
        handle: { requiredRole: [2, 3] }
      },
      {
        path: "solicitar-materiales",
        element: <SolicitarMateriales />,
        handle: { requiredRole: 3 }
      },
      {
        path: "tasks/:zoneId",  // Quitar el slash inicial
        element: <TaskList />,
        handle: { requiredRole: [2, 3] }
      },
    ],
  },
  {
    path: "*",
    element: <h1>404 - Página no encontrada</h1>
  }
]);

// Renderiza la aplicación con AuthProvider y StrictMode
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
