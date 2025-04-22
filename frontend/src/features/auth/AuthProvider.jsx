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
    const [user, setUser] = useState(null);
    const [csrfToken, setCsrfToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // Intentar recuperar el roleId del localStorage como respaldo
                const storedRoleId = localStorage.getItem('roleId');
                if (storedRoleId) {
                    setRoleId(storedRoleId);
                }

                const response = await axios.get(`${import.meta.env.VITE_API_ENDPOINT}/api/auth/me`, {
                    withCredentials: true
                });
                
                if (response.data?.user) {
                    setIsAuthenticated(true);
                    
                    // Establecer toda la información del usuario
                    setUser(response.data.user);
                    
                    // Actualizar el roleId desde la respuesta del servidor
                    if (response.data.user.roleId) {
                        const newRoleId = response.data.user.roleId.toString();
                        setRoleId(newRoleId);
                        localStorage.setItem('roleId', newRoleId);
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

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            setIsAuthenticated, 
            roleId, 
            setRoleId,
            user,
            setUser,
            csrfToken,
            setCsrfToken,
            authRequest,
            logout
        }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);