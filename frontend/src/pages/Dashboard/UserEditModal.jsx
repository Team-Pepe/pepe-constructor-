import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient, getAuthHeaders } from "@/services/dashboardService";
import { motion, AnimatePresence } from "framer-motion";

export default function UserEditModal({ user, onClose, onSave, users }) {
  const [form, setForm] = useState({
    id: "",
    username: "",
    email: "",
    bloodType: "",
    roleId: 2,
    jobId: ""
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
        roleId: user.roleId?.toString() || "2", 
        // Convertir jobId a string incluso si es null 
        jobId: user.job?.id ? user.job.id.toString() : user.jobId?.toString() || "" 
      }); 
    } else {
      setForm({
        id: "",
        username: "",
        email: "",
        bloodType: "",
        roleId: "2",
        jobId: ""
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

  const handleSelectChange = (name, value) => { 
    setForm(prev => ({ ...prev, [name]: value })); 
  }; 

  // In the handleSubmit function 
  const handleSubmit = (e) => { 
    e.preventDefault(); 

    const formData = { 
      ...form, 
      roleId: Number(form.roleId), 
      // Asegurar conversión numérica incluso si viene de un valor string vacío 
      jobId: form.roleId === "2" && form.jobId && form.jobId !== "none" ? Number(form.jobId) : null 
    }; 
    
    console.log("Enviando datos de usuario:", formData); 
    onSave(formData); 
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md relative"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ 
            scale: 1, 
            y: 0, 
            opacity: 1,
            transition: { 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              delay: 0.1 
            }
          }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
        >
          <motion.button
            className="absolute right-2 top-2 text-slate-400 hover:text-white bg-transparent border-none p-2 rounded-full"
            onClick={onClose}
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={18} />
          </motion.button>
          
          <div className="p-6">
            <motion.h2 
              className="text-xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            >
              {user ? "Editar Usuario" : "Crear Usuario"}
            </motion.h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Diseño en dos columnas para campos principales */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div 
                  className="space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                >
                  <Label htmlFor="id" className="text-sm text-slate-300">ID (Documento)</Label>
                  <Input
                    id="id"
                    name="id"
                    value={form.id}
                    onChange={handleChange}
                    placeholder="Documento"
                    className="bg-slate-700 border-slate-600 h-9 text-sm"
                    required
                    minLength={6}
                    maxLength={10}
                    pattern="[0-9]{6,10}"
                    inputMode="numeric"
                    disabled={!!user}
                  />
                  {errors.id && (
                    <motion.p 
                      className="text-red-400 text-xs"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {errors.id}
                    </motion.p>
                  )}
                </motion.div>
                
                <motion.div 
                  className="space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                >
                  <Label htmlFor="username" className="text-sm text-slate-300">Nombre</Label>
                  <Input
                    id="username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Nombre"
                    className="bg-slate-700 border-slate-600 h-9 text-sm"
                    required
                  />
                  {errors.username && (
                    <motion.p 
                      className="text-red-400 text-xs"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {errors.username}
                    </motion.p>
                  )}
                </motion.div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <motion.div 
                  className="space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                >
                  <Label htmlFor="email" className="text-sm text-slate-300">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    className="bg-slate-700 border-slate-600 h-9 text-sm"
                    required
                  />
                  {errors.email && (
                    <motion.p 
                      className="text-red-400 text-xs"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </motion.div>
                
                <motion.div 
                  className="space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.6 } }}
                >
                  <Label htmlFor="bloodType" className="text-sm text-slate-300">Tipo de Sangre</Label>
                  <Select
                    value={form.bloodType || ""}
                    onValueChange={(value) => handleSelectChange("bloodType", value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 h-9 text-sm text-white">
                      <SelectValue placeholder="Tipo sangre" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="A+" className="text-white hover:bg-slate-700">A+</SelectItem>
                      <SelectItem value="A-" className="text-white hover:bg-slate-700">A-</SelectItem>
                      <SelectItem value="B+" className="text-white hover:bg-slate-700">B+</SelectItem>
                      <SelectItem value="B-" className="text-white hover:bg-slate-700">B-</SelectItem>
                      <SelectItem value="AB+" className="text-white hover:bg-slate-700">AB+</SelectItem>
                      <SelectItem value="AB-" className="text-white hover:bg-slate-700">AB-</SelectItem>
                      <SelectItem value="O+" className="text-white hover:bg-slate-700">O+</SelectItem>
                      <SelectItem value="O-" className="text-white hover:bg-slate-700">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Si el rol NO es trabajador (2), el selector de rol ocupa ambas columnas */}
                <motion.div 
                  className={`space-y-1 ${form.roleId !== "2" ? "col-span-2" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.7 } }}
                >
                  <Label htmlFor="roleId" className="text-sm text-slate-300">Rol</Label>
                  <Select
                    value={form.roleId}
                    onValueChange={(value) => handleSelectChange("roleId", value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 h-9 text-sm">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="1" className="text-white hover:bg-slate-700">Supervisor</SelectItem>
                      <SelectItem value="2" className="text-white hover:bg-slate-700">Trabajador</SelectItem>
                      <SelectItem value="3" className="text-white hover:bg-slate-700">Jefe de obra</SelectItem>
                      <SelectItem value="4" className="text-white hover:bg-slate-700">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
                
                <AnimatePresence mode="wait">
                  {form.roleId === "2" ? (
                    <motion.div 
                      key="job-field"
                      className="space-y-1"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: 1,
                        transition: { 
                          type: "spring", 
                          damping: 20, 
                          stiffness: 300,
                          delay: 0.1
                        }
                      }}
                      exit={{ 
                        opacity: 0, 
                        y: -10, 
                        scale: 0.95,
                        transition: {
                          duration: 0.2
                        }
                      }}
                    >
                      <Label htmlFor="jobId" className="text-sm text-slate-300">Especialidad</Label>
                      <Select
                        value={form.jobId}
                        onValueChange={(value) => handleSelectChange("jobId", value)}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 h-9 text-sm text-white">
                          <SelectValue placeholder="Especialidad" className="text-white" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="none" className="text-white hover:bg-slate-700">Sin especialidad</SelectItem>
                          <SelectItem value="1" className="text-white hover:bg-slate-700">Electricista</SelectItem>
                          <SelectItem value="2" className="text-white hover:bg-slate-700">Albañil</SelectItem>
                          <SelectItem value="3" className="text-white hover:bg-slate-700">Fontanero</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
              
              <motion.div 
                className="flex justify-end gap-2 pt-3 mt-2 border-t border-slate-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.8 } }}
              >
                <motion.button 
                  type="button" 
                  className="px-3 py-1.5 text-sm rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
                  onClick={onClose}
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(51, 65, 85, 0.8)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancelar
                </motion.button>
                <motion.button 
                  type="submit" 
                  className="px-3 py-1.5 text-sm rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.03, backgroundColor: "#c2410c" }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : "Guardar"}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}