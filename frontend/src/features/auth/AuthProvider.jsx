import { useContext, createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext({
    isAuthenticated: false,
    roleId: null,
    user: null,
    csrfToken: null,
});

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [roleId, setRoleId] = useState(null);
    const [user, setUser] = useState({
        id: null,
        username: null,
        name: null,
        bloodType: null,
        roleId: null,
        role: null
    });
    const [csrfToken, setCsrfToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // Intentar recuperar el roleId del localStorage como respaldo
                const storedRoleId = localStorage.getItem('roleId');
                if (storedRoleId) {
                    setRoleId(Number(storedRoleId));
                }

                const response = await axios.get(`${import.meta.env.VITE_API_ENDPOINT}/api/auth/me`, {
                    withCredentials: true
                });
                
                if (response.data?.user) {
                    setIsAuthenticated(true);
                    // Guardar todos los datos del usuario
                    setUser({
                        id: response.data.user.id,
                        name: response.data.user.name,
                        username: response.data.user.username,
                        bloodType: response.data.user.bloodType,
                        roleId: response.data.user.roleId,
                        role: response.data.user.role
                    });
                    
                    if (response.data.user.roleId) {
                        setRoleId(Number(response.data.user.roleId));
                        localStorage.setItem('roleId', String(response.data.user.roleId));
                    }
                    
                    if (response.data.csrfToken) {
                        setCsrfToken(response.data.csrfToken);
                    }
                }
            } catch (error) {
                console.error("Error al verificar estado de autenticación:", error);
                // Si el token ha expirado o es inválido, asegurarse de limpiar estado
                setIsAuthenticated(false);
                // No limpiamos el roleId aquí para mantener compatibilidad con login offline
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    // Función para hacer requests autenticados con CSRF
    const authRequest = async (config) => {
        return axios({
            ...config,
            withCredentials: true,
            // Comentamos temporalmente el header CSRF
            // headers: {
            //     ...config.headers,
            //     'X-CSRF-Token': csrfToken
            // }
        });
    };

    // Función global de logout
    const logout = () => {
        setIsAuthenticated(false);
        setRoleId(null);
        setUser(null);
        setCsrfToken(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("csrfToken");
        localStorage.removeItem("roleId");
        localStorage.removeItem("userId");
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    };

    // Función para procesar el login
    const login = async (credentials) => {
        try {
            const loginResponse = await axios.post(`${import.meta.env.VITE_API_ENDPOINT}/api/auth/login`, credentials);
            if (loginResponse.data?.user) {
                const userData = loginResponse.data.user;
                
                // Guardar TODOS los datos relevantes en localStorage
                localStorage.setItem('userId', userData.id?.toString());
                localStorage.setItem('username', userData.username || userData.name);
                localStorage.setItem('name', userData.name);
                localStorage.setItem('bloodType', userData.bloodType || "O+"); // Valor por defecto
                localStorage.setItem('roleId', userData.roleId?.toString() || "2");
                localStorage.setItem('email', userData.email || "");
                localStorage.setItem('role', userData.role || "Trabajador");
                
                // Actualizar el estado con TODOS los datos
                setUser({
                    id: userData.id?.toString(),
                    username: userData.username || userData.name,
                    name: userData.name,
                    bloodType: userData.bloodType || "O+",
                    roleId: userData.roleId,
                    role: userData.role || "Trabajador",
                    email: userData.email
                });
                setIsAuthenticated(true);
                setRoleId(userData.roleId);
            }
        } catch (error) {
            console.error("Error al procesar el login:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, setIsAuthenticated, 
            roleId, setRoleId, user, setUser, 
            csrfToken, setCsrfToken, authRequest, logout, login, isLoading
        }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
}

// Añadir esta línea al final del archivo
export const useAuth = () => useContext(AuthContext);