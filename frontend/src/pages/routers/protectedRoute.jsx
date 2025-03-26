import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider"; // 👈 Asegúrate de que la ruta es correcta

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}
