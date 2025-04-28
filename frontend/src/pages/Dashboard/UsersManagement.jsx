import React, { useState, useEffect } from "react";
import { apiClient, getAuthHeaders } from "@/services/dashboardService";
import { 
  Search, 
  Edit, 
  Trash2, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserEditModal from "./UserEditModal";

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalUser, setModalUser] = useState(null);

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
      if (modalUser) {
        await apiClient.put(`/api/users/${modalUser.id}`, form, { headers: getAuthHeaders() });
      } else {
        await apiClient.post("/api/users", form, { headers: getAuthHeaders() });
      }
      setShowModal(false);
      setModalUser(null);
      fetchUsers();
    } catch (error) {
      alert("Error al guardar usuario");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await apiClient.delete(`/api/users/${id}`, { headers: getAuthHeaders() });
      fetchUsers();
    } catch (error) {
      alert("Error al eliminar usuario");
    }
  };

  const filteredUsers = users.filter(user => 
    user.id.toString().includes(searchTerm) ||
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header y Buscador */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
        <div className="w-full sm:w-auto">
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
        </div>
      </div>

      {/* Tabla de Usuarios - Contenedor con scroll horizontal */}
      <div className="rounded-lg border border-slate-700 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-slate-300">ID</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Nombre</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Email</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Tipo Sangre</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Rol</th>
              <th className="px-4 py-3 text-right text-sm text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-t border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-300">{user.id}</td>
                  <td className="px-4 py-3 text-white">{user.username}</td>
                  <td className="px-4 py-3 text-slate-300">{user.email}</td>
                  <td className="px-4 py-3 text-slate-300">{user.bloodType}</td>
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
                  <td className="px-4 py-3 text-right">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}

export default UsersManagement;