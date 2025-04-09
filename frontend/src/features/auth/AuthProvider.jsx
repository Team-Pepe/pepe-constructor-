// Modificar esta línea
import { useContext, createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext({
    isAuthenticated: false,
    roleId: null,
    csrfToken: null,
});

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Cambiar null a false
    const [roleId, setRoleId] = useState(null);
    const [csrfToken, setCsrfToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Añadir estado de carga

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await axios.get("http://localhost:3000/api/auth/me", {
                    withCredentials: true
                });
                
                if (response.data?.user?.roleId) {
                    setIsAuthenticated(true);
                    setRoleId(response.data.user.roleId);
                    if (response.data.csrfToken) {
                        setCsrfToken(response.data.csrfToken);
                    }
                }
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false); // Siempre detener la carga
            }
        };

        checkAuthStatus();
    }, []);

    // Función para hacer requests autenticados con CSRF
    const authRequest = async (config) => {
        return axios({
            ...config,
            withCredentials: true,
            headers: {
                ...config.headers,
                'X-CSRF-Token': csrfToken
            }
        });
    };

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            setIsAuthenticated, 
            roleId, 
            setRoleId,
            csrfToken,
            setCsrfToken,
            authRequest
        }}>
            {!isLoading && children} {/* Renderizar solo cuando carga completa */}
        </AuthContext.Provider>
    );
}

// Añadir esta línea al final del archivo
export const useAuth = () => useContext(AuthContext);