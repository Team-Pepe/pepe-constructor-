import { Navigate, Outlet, useMatches, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute() {
  const { isAuthenticated, roleId, isLoading, logout } = useAuth();
  const matches = useMatches();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener el rol requerido de la ruta actual
  const { handle } = matches.find(match => match.handle) || {};
  const requiredRole = handle?.requiredRole;

  // Verificar validez del token al cargar la ruta
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    
    if (token) {
      try {
        // Verificar si el token ha expirado
        const decoded = jwtDecode(token);
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

  // Redirigir al dashboard si el usuario ya está autenticado y trata de acceder al login
  useEffect(() => {
    if (isAuthenticated && location.pathname === "/login") {
      const dashboardRoute = roleId === 1 ? "/dashboard" : "/dashboard-empleados";
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, roleId]);

  // Prevenir el uso del botón atrás para volver al login
  useEffect(() => {
    const handlePopState = () => {
      if (isAuthenticated && window.location.pathname === "/login") {
        const dashboardRoute = roleId === 1 ? "/dashboard" : "/dashboard-empleados";
        navigate(dashboardRoute, { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isAuthenticated, navigate, roleId]);

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