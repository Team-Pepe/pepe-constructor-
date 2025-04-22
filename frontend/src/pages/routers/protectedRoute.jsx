import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export default function ProtectedRoute() {
  const { isAuthenticated, roleId, isLoading, logout } = useAuth();
  const matches = useMatches();
  
  // Obtener el rol requerido de la ruta actual
  const { handle } = matches.find(match => match.handle) || {};
  const requiredRole = handle?.requiredRole;

  // Convertir roleId a número para comparación consistente
  const userRoleId = Number(roleId);

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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Validar rol contra el requerido por la ruta
  if (requiredRole) {
    // Caso 1: requiredRole es un array de roles permitidos
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRoleId)) {
        console.log(`Acceso denegado: Rol ${userRoleId} no está en la lista de roles permitidos:`, requiredRole);
        return <Navigate to={userRoleId === 1 ? "/dashboard" : "/dashboard-empleados"} replace />;
      }
    } 
    // Caso 2: requiredRole es un valor único
    else if (userRoleId !== requiredRole) {
      console.log(`Acceso denegado: Rol ${userRoleId} no coincide con el rol requerido:`, requiredRole);
      return <Navigate to={userRoleId === 1 ? "/dashboard" : "/dashboard-empleados"} replace />;
    }
  }

  return <Outlet />;
}