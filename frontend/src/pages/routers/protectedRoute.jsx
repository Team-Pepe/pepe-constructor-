import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export default function ProtectedRoute() {
  const { isAuthenticated, roleId } = useAuth();

  if (!isAuthenticated) {
    // Si no está autenticado, redirige al login
    return <Navigate to="/login" replace />;
  }

  // Verifica si el usuario tiene acceso a la ruta actual
  const currentPath = window.location.pathname;

  if (roleId === 2 && currentPath === "/dashboard") {
    // Si el usuario es un trabajador (role_id = 2) y trata de acceder a /dashboard, redirige
    return <Navigate to="/dashboard-empleados" replace />;
  }

  return <Outlet />;
}
