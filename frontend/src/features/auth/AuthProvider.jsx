import { useContext, createContext, useState, useEffect } from "react";

const AuthContext = createContext({
  isAuthenticated: false,
  roleId: null,
});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedRoleId = localStorage.getItem("roleId"); // Recupera el role_id del localStorage
    setIsAuthenticated(!!token);
    setRoleId(storedRoleId ? parseInt(storedRoleId, 10) : null); // Convierte roleId a número
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, roleId, setRoleId }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);