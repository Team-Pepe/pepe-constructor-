import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, redirect } from "react-router-dom";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginPage, Register, ForgotPassword as FPassword } from "@/features/auth";
import ResetPassword from "@/features/auth/reset-password"; // Importa el nuevo componente
import Dashboard from "@/pages/Dashboard/dashboard";
import DashboardEmpleados from "@/pages/DashboardWorkers/dashboard-empleados";
import ProtectedRoute from "@/pages/routers/protectedRoute";

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
        // Añadir metadatos para el rol requerido
        handle: { requiredRole: 1 }
      },
      {
        path: "dashboard-empleados",
        element: <DashboardEmpleados />,
        handle: { requiredRole: 2 }
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
