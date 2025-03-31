import { useContext, createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext({
  isAuthenticated: false,
  roleId: null,
});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Inicial como null para indicar carga
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        axios.defaults.withCredentials = true;
        const response = await axios.get("http://localhost:3000/api/auth/me");
        
        if (response.data?.user?.roleId) {
          setIsAuthenticated(true);
          setRoleId(response.data.user.roleId);
        } else {
          setIsAuthenticated(false);
          setRoleId(null);
        }
      } catch (error) {
        console.error("Error al verificar la autenticación:", error);
        setIsAuthenticated(false);
        setRoleId(null);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      setIsAuthenticated, 
      roleId, 
      setRoleId 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);