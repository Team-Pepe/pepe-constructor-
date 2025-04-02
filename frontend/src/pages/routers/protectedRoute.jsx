import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export default function ProtectedRoute() {
  const { isAuthenticated, roleId } = useAuth();

  if (isAuthenticated === null) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero no tiene roleId válido
  if (roleId !== 1 && roleId !== 2) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}