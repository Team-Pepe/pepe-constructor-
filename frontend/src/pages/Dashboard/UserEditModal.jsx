import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function UserEditModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    bloodType: "",
    roleId: "2", // Default to worker
    jobId: null  // Add jobId field
  });

  // Initialize form with user data if editing
  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        bloodType: user.bloodType || "",
        roleId: user.roleId?.toString() || "2",
        jobId: user.jobId ? user.jobId.toString() : null // Handle null correctly
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Simplificar el handleSubmit para asegurarnos de que jobId se envíe correctamente
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Crear una copia del formulario para modificar
    const formData = {...form};
    
    // Convertir roleId a número
    formData.roleId = Number(formData.roleId);
    
    // Convertir jobId a número solo si existe y no está vacío
    if (formData.jobId && formData.jobId !== "") {
      formData.jobId = Number(formData.jobId);
    } else {
      formData.jobId = null;
    }
    
    // Si no es trabajador, asegurarse de que jobId sea null
    if (formData.roleId !== 2) {
      formData.jobId = null;
    }
    
    console.log("Enviando datos de usuario:", formData);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md relative animate-fade-in-up">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-slate-400 hover:text-white"
          onClick={onClose}
        >
          <X size={18} />
        </Button>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {user ? "Editar Usuario" : "Crear Usuario"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Nombre de usuario"
                className="bg-slate-700"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className="bg-slate-700"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bloodType">Tipo de Sangre</Label>
              <Select
                value={form.bloodType || ""}
                onValueChange={(value) => handleSelectChange("bloodType", value)}
              >
                <SelectTrigger className="bg-slate-700">
                  <SelectValue placeholder="Seleccionar tipo de sangre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roleId">Rol</Label>
              <Select
                value={form.roleId}
                onValueChange={(value) => handleSelectChange("roleId", value)}
              >
                <SelectTrigger className="bg-slate-700">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Supervisor</SelectItem>
                  <SelectItem value="2">Trabajador</SelectItem>
                  <SelectItem value="3">Jefe de obra</SelectItem>
                  <SelectItem value="4">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Solo mostrar selección de trabajo si el rol es Trabajador (roleId = 2) */}
            {form.roleId === "2" && (
              <div className="space-y-2">
                <Label htmlFor="jobId">Especialidad</Label>
                <Select
                  value={form.jobId || ""}
                  onValueChange={(value) => handleSelectChange("jobId", value)}
                >
                  <SelectTrigger className="bg-slate-700">
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Electricista</SelectItem>
                    <SelectItem value="2">Albañil</SelectItem>
                    <SelectItem value="3">Fontanero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                Guardar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserEditModal;