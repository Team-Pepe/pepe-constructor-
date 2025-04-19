import { Navigate, Outlet, useMatches } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute() {
  const { isAuthenticated, roleId, isLoading, logout } = useAuth();
  const matches = useMatches();
  
  // Obtener el rol requerido de la ruta actual
  const { handle } = matches.find(match => match.handle) || {};
  const requiredRole = handle?.requiredRole;

  // Verificar validez del token al cargar la ruta
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    
    if (token) {
      try {
        // Verificar si el token ha expirado
        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          // Token expirado, forzar logout
          logout();
        }
      } catch (error) {
        // Token inválido, forzar logout
        console.error("Error al verificar token:", error);
        logout();
      }
    }
  }, [logout]);

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