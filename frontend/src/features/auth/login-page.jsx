"use client";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Lock, Mail, Eye, EyeOff } from "lucide-react"; // Importamos los íconos Eye y EyeOff
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import fondo from "../../assets/fondo.jpg";
import { useAuth } from "@/features/auth/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Estado para alternar visibilidad de la contraseña
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setIsAuthenticated, setRoleId, setCsrfToken } = useAuth();

  useEffect(() => {
    setIsAuthenticated(false);
    setRoleId(null);
    setCsrfToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("csrfToken");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      axios.defaults.withCredentials = true;

      const response = await axios.post(
        `${import.meta.env.VITE_API_ENDPOINT}/api/auth/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data?.user?.roleId) {
        setIsAuthenticated(true);
        setRoleId(response.data.user.roleId);

        // Guardar el token de autenticación
        if (response.data.token) {
          document.cookie = `token=${response.data.token}; path=/`;
          localStorage.setItem("authToken", response.data.token); // <-- Agrega esta línea
        }

        if (response.data.csrfToken) {
          setCsrfToken(response.data.csrfToken);
          localStorage.setItem("csrfToken", response.data.csrfToken);
        }

        const roleId = Number(response.data.user.roleId);
        if (roleId === 1) {
          navigate("/dashboard");
        } else if (roleId === 2) {
          navigate("/dashboard-empleados");
        } else {
          setError("Rol no válido");
        }
      } else {
        setError("Respuesta del servidor incompleta");
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);

      if (err.response) {
        if (err.response.status === 401) {
          setError("Credenciales inválidas");
        } else if (err.response.status === 403) {
          setError("Acceso no autorizado");
        } else {
          setError(err.response?.data?.message || "Error al iniciar sesión");
        }
      } else if (err.request) {
        setError("No se recibió respuesta del servidor");
      } else {
        setError("Error al configurar la solicitud");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        height: "100vh",
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"} // Alterna entre texto y contraseña
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)} // Alterna visibilidad
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Cargando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              Google
            </Button>
            <Button variant="outline" className="w-full">
              Microsoft
            </Button>
          </div>
          <div className="text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}