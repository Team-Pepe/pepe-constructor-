import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient, getAuthHeaders } from "@/services/dashboardService";

export default function UserEditModal({ user, onClose, onSave, users }) {
  const [form, setForm] = useState({
    id: "",
    username: "",
    email: "",
    bloodType: "",
    roleId: 2,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        id: user.id || "",
        username: user.username || "",
        email: user.email || "",
        bloodType: user.bloodType || "",
        roleId: user.roleId || 2,
      });
    } else {
      setForm({
        id: "",
        username: "",
        email: "",
        bloodType: "",
        roleId: 2,
      });
    }
    setErrors({});
  }, [user]);

  // Validaciones
  const validate = async () => {
    const csrfToken = localStorage.getItem('csrfToken');
    if (!csrfToken) {
      alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
      window.location.href = "/login";
      return false;
    }

    const newErrors = {};
    // Solo validar ID si es creación
    if (!user) {
      if (!/^\d{6,10}$/.test(form.id)) {
        newErrors.id = "El ID debe tener entre 6 y 10 dígitos numéricos.";
      } else {
        try {
          const res = await apiClient.get(`/api/users?id=${form.id}`, {
            headers: getAuthHeaders()
          });
          const data = res.data;
          if (Array.isArray(data) && data.length > 0) {
            newErrors.id = "Ya existe un usuario con este ID.";
          }
        } catch {}
      }
    }
    // Email: formato válido
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)) {
      newErrors.email = "Correo electrónico inválido.";
    } else if (!user || form.email !== user.email) {
      // Solo validar unicidad si es nuevo o cambió el correo
      try {
        const res = await apiClient.get(`/api/users?email=${form.email}`, {
          headers: getAuthHeaders()
        });
        const data = res.data;
        
        // Corregido: Verificar correctamente si el correo pertenece a otro usuario
        const emailExists = Array.isArray(data) && data.length > 0 && 
          data.some(existingUser => 
            existingUser.email === form.email && 
            (!user || existingUser.id !== user.id)
          );
        
        if (emailExists) {
          newErrors.email = "Ya existe un usuario con este correo.";
        }
      } catch (error) {
        console.error("Error al verificar email:", error);
      }
    }
    // Username: requerido
    if (!form.username.trim()) {
      newErrors.username = "El nombre es obligatorio.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (await validate()) {
      onSave(form);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-lg shadow-lg w-full max-w-md border border-slate-700 animate-fade-in-up">
        <h3 className="text-xl font-bold mb-4 text-white">
          {user ? "Editar Usuario" : "Nuevo Usuario"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="id" className="text-slate-200">ID (Documento)</Label>
            <Input
              name="id"
              id="id"
              placeholder="Número de documento"
              value={form.id}
              onChange={handleChange}
              required
              minLength={6}
              maxLength={10}
              pattern="[0-9]{6,10}"
              inputMode="numeric"
              disabled={!!user} // Solo editable al crear
              className="bg-slate-800 text-white"
            />
            {errors.id && <p className="text-red-400 text-xs mt-1">{errors.id}</p>}
          </div>
          <div>
            <Label htmlFor="username" className="text-slate-200">Nombre</Label>
            <Input
              name="username"
              id="username"
              placeholder="Nombre completo"
              value={form.username}
              onChange={handleChange}
              required
              className="bg-slate-800 text-white"
            />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
          </div>
          <div>
            <Label htmlFor="email" className="text-slate-200">Correo Electrónico</Label>
            <Input
              name="email"
              id="email"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={handleChange}
              required
              type="email"
              className="bg-slate-800 text-white"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="bloodType" className="text-slate-200">Tipo de Sangre</Label>
            <select
              name="bloodType"
              id="bloodType"
              value={form.bloodType}
              onChange={handleChange}
              className="bg-slate-800 text-white w-full rounded px-3 py-2 border border-slate-700"
            >
              <option value="">Seleccionar tipo de sangre</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div>
            <Label htmlFor="roleId" className="text-slate-200">Rol</Label>
            <select
              name="roleId"
              id="roleId"
              value={form.roleId}
              onChange={handleChange}
              className="bg-slate-800 text-white w-full rounded px-3 py-2"
            >
              <option value={1}>Supervisor</option>
              <option value={2}>Trabajador</option>
              <option value={3}>Jefe de Obra</option>
              <option value={4}>Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}