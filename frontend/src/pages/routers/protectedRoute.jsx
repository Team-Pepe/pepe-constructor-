import { Navigate, Outlet, useMatches } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export default function ProtectedRoute() {
  const { isAuthenticated, roleId, isLoading } = useAuth();
  const matches = useMatches();
  
  // Obtener el rol requerido de la ruta actual
  const { handle } = matches.find(match => match.handle) || {};
  const requiredRole = handle?.requiredRole;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Validar rol contra el requerido por la ruta
  if (requiredRole && roleId !== requiredRole) {
    return <Navigate to={roleId === 1 ? "/dashboard" : "/dashboard-empleados"} replace />;
  }

  return <Outlet />;
}