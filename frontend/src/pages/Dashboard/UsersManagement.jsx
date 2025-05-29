import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Edit, Trash2, Loader2, UserPlus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, getAuthHeaders, updateUserData } from "@/services/dashboardService";
import UserEditModal from "./UserEditModal";
import BarcodeScanner from "./BarcodeScanner"; // Añade esta importación
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion } from "framer-motion";

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  // Función para abrir/cerrar el escáner
  const toggleScanner = () => {
    setShowScanner(!showScanner);
  };

  async function fetchUsers() {
    try {
      const response = await apiClient.get('/api/users', {
        headers: getAuthHeaders()
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (form) => {
    try {
      console.log("Guardando usuario con datos:", form);
      
      // Asegurarnos de que jobId sea null si no es un trabajador
      if (form.roleId !== 2) {
        form.jobId = null;
      }
      
      if (modalUser) {
        // Actualizar usuario existente usando la nueva función 
        await updateUserData(modalUser.id, form);
      } else {
        // Crear nuevo usuario
        await apiClient.post("/api/users", form, { 
          headers: getAuthHeaders() 
        });
      }
      
      setShowModal(false);
      setModalUser(null);
      fetchUsers(); // Recargar la lista de usuarios
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      alert("Error al guardar usuario: " + (error.response?.data?.message || error.message));
    }
  };

  // Añade esta función para verificar si el usuario existe
  const checkUserExists = async (id) => {
    try {
      // En lugar de intentar obtener un usuario específico por ID,
      // usaremos la ruta que ya sabemos que funciona y filtraremos por ID
      const response = await apiClient.get('/api/users', { 
        headers: getAuthHeaders() 
      });
      
      // Verificar si el usuario existe en la lista
      if (Array.isArray(response.data)) {
        return response.data.some(user => user.id === id);
      }
      return false;
    } catch (error) {
      console.error("Error al verificar usuario:", error);
      return false;
    }
  };
  
  const handleDeleteUser = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    
    try {
      console.log("Intentando eliminar usuario con ID:", id);
      
      // Verificar si el usuario existe en nuestra lista local
      const userExists = users.some(user => user.id === id);
      if (!userExists) {
        alert("No se puede eliminar: El usuario no existe en la lista actual.");
        return;
      }
      
      // Intentar eliminar el usuario
      try {
        await apiClient.delete(`/api/users/${id}`, { 
          headers: getAuthHeaders() 
        });
        
        alert("Usuario eliminado con éxito");
      } catch (error) {
        // Si el backend no tiene endpoint para eliminar, hacemos una solución alternativa
        if (error.response && error.response.status === 404) {
          // Eliminar localmente y mostrar mensaje
          setUsers(users.filter(user => user.id !== id));
          alert("El usuario ha sido eliminado de la lista (nota: el endpoint de eliminación no está disponible en el servidor)");
        } else {
          throw error; // Re-lanzar para que lo maneje el catch externo
        }
      }
      
      // Actualizar la lista de usuarios
      fetchUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert(`Error al eliminar usuario: ${error.message || 'Error desconocido'}`);
      
      // Actualizar la lista de usuarios de todos modos
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(user => 
    user.id.toString().includes(searchTerm) ||
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Function to get job name from job ID
  const getJobName = (jobId) => { 
    if (!jobId) return "No asignado"; // Handle null/undefined 
      
    switch (Number(jobId)) { 
      case 1: return "Electricista"; 
      case 2: return "Albañil"; 
      case 3: return "Fontanero"; 
      default: return "No asignado"; // Handle unknown values 
    } 
  }; 

  const handleScanComplete = (barcode) => {
    // Establecer el código escaneado como término de búsqueda
    setSearchTerm(barcode);
    setShowScanner(false);
  };

  return (
    <motion.div 
      className="space-y-6 animate-fade-in"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          type: "spring",
          damping: 25,
          stiffness: 300
        }
      }}
    >
      {/* Header y Buscador con animación */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            delay: 0.2,
            duration: 0.3
          }
        }}
      >
        <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
        <div className="w-full sm:w-auto flex gap-2">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por ID, nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 w-full"
            />
          </div>
          <Button 
            variant="outline" 
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            onClick={() => setShowScanner(true)}
          >
            <Camera className="mr-2 h-4 w-4" />
            Escanear
          </Button>
        </div>
      </motion.div>

      {/* Tabla con animación */}
      <motion.div 
        className="rounded-lg border border-slate-700 overflow-x-auto relative [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-800 [&::-webkit-scrollbar-thumb]:bg-slate-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            delay: 0.3,
            duration: 0.3
          }
        }}
      >
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-slate-300">ID</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Nombre</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Email</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Tipo Sangre</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Rol</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Especialidad</th>
              <th className="px-4 py-3 text-right text-sm text-slate-300 sticky right-0 bg-slate-800">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: {
                      delay: index * 0.05,
                      duration: 0.3
                    }
                  }}
                  className="border-t border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-300">{user.id}</td>
                  <td className="px-4 py-3 text-white">{user.username}</td>
                  <td className="px-4 py-3 text-slate-300">{user.email}</td>
                  <td className="px-4 py-3 text-slate-300">{user.bloodType || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap
                      ${user.roleId === 4 ? 'bg-purple-500/20 text-purple-300' :
                        user.roleId === 1 ? 'bg-blue-500/20 text-blue-300' :
                        user.roleId === 2 ? 'bg-green-500/20 text-green-300' :
                        'bg-orange-500/20 text-orange-300'}`}>
                      {user.roleId === 4 ? 'Admin' :
                       user.roleId === 1 ? 'Supervisor' :
                       user.roleId === 2 ? 'Trabajador' : 
                       'Jefe de obra'}
                    </span>
                  </td>
                  <td className="px-4 py-3"> 
                    {user.roleId === 2 ? ( 
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap 
                        ${user.job?.id === 1 ? 'bg-blue-500/20 text-blue-300' : 
                          user.job?.id === 2 ? 'bg-orange-500/20 text-orange-300' : 
                          user.job?.id === 3 ? 'bg-green-500/20 text-green-300' : 
                          'bg-slate-500/20 text-slate-300'}`}> 
                        {user.job?.name || "No asignado"} 
                      </span> 
                    ) : ( 
                      <span className="text-slate-400 text-xs">—</span> 
                    )} 
                  </td>
                  <td className="px-4 py-3 text-right sticky right-0 bg-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setModalUser(user);
                        setShowModal(true);
                      }}
                      className="mr-2 hover:bg-slate-700"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {showModal && (
        <UserEditModal
          user={modalUser}
          onClose={() => {
            setShowModal(false);
            setModalUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}

      {/* Modal para el escáner de códigos de barras */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Escanear Código</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowScanner(false)}
                className="hover:bg-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </Button>
            </div>
            <BarcodeScanner 
              onScan={handleScanComplete} 
              onClose={() => setShowScanner(false)} 
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default UsersManagement;