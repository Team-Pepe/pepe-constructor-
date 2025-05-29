import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ListTodo, ArrowLeft, Package, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
// Importar la imagen de fondo
import fondo2 from "../../../assets/fondo2.jpg";

const TaskList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { zoneId } = useParams();
  const zoneName = location.state?.zoneName || "Zona no especificada";

  useEffect(() => {
    console.log("TaskList montado:", { zoneId, zoneName, locationState: location.state });
  }, [zoneId, zoneName, location.state]);

  const [tasks, setTasks] = useState([
    { id: 1, title: "Revisar instalaciones eléctricas", status: "assigned", description: "Verificar el estado de las conexiones principales" },
    { id: 2, title: "Mantenimiento de tuberías", status: "in-progress", description: "Reparar fugas en el sistema de agua" },
    { id: 3, title: "Pintura de paredes", status: "completed", description: "Aplicar segunda capa de pintura en la zona norte" }
  ]);

  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'assigned'
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "in-progress":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "assigned":
        return <ListTodo className="h-5 w-5" />;
      case "in-progress":
        return <Clock className="h-5 w-5" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "assigned":
        return "Asignada";
      case "in-progress":
        return "En Proceso";
      case "completed":
        return "Finalizada";
      default:
        return status;
    }
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar la tarea en la BD
    const taskToAdd = {
      id: Date.now(), // Temporal, normalmente vendría de la BD
      ...newTask
    };
    setTasks(prevTasks => [...prevTasks, taskToAdd]);
    setNewTask({ title: '', description: '', status: 'assigned' });
    setShowNewTaskForm(false);
  };

  return (
    <motion.div
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
      className="min-h-screen p-6"
      style={{
        backgroundImage: `url(${fondo2})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        height: "100vh"
      }}
    >
      {/* Contenedor principal con fondo semitransparente */}
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              delay: 0.1,
              duration: 0.3
            }
          }}
        >
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => {
                    navigate('/dashboard-empleados', { 
                      replace: true,
                      state: { 
                        activeSection: 'zonas-guardadas'
                      } 
                    });
                  }}
                  variant="outline" 
                  className="bg-slate-800/80 border-orange-500 text-orange-500 hover:bg-orange-500/20 hover:text-orange-400"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <h2 className="text-2xl font-bold px-4 py-2 bg-slate-800/90 rounded-lg text-white inline-block">
                  Tareas en {zoneName}
                </h2>
              </div>
            </div>

            {/* New Task Section */}
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              {!showNewTaskForm ? (
                <Button
                  onClick={() => setShowNewTaskForm(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar Nueva Tarea
                </Button>
              ) : (
                <Card className="w-full bg-slate-800/50 border-slate-700/50 p-4">
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          Título de la Tarea
                        </label>
                        <input
                          type="text"
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                          className="w-full px-3 py-2 rounded-md bg-slate-900/50 border border-slate-700/50 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          Estado Inicial
                        </label>
                        <select
                          value={newTask.status}
                          onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                          className="w-full px-3 py-2 rounded-md bg-slate-900/50 border border-slate-700/50 text-white"
                        >
                          <option value="assigned">Asignada</option>
                          <option value="in-progress">En Proceso</option>
                          <option value="completed">Finalizada</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Descripción
                      </label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        className="w-full px-3 py-2 rounded-md bg-slate-900/50 border border-slate-700/50 text-white h-24"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewTaskForm(false)}
                        className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Crear Tarea
                      </Button>
                    </div>
                  </form>
                </Card>
              )}
            </div>

            {/* Info Section - Movido arriba */}
            <div className="mb-4">
              <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm p-6">
                <h3 className="text-lg font-semibold text-orange-400 mb-4">Estados de Tareas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-slate-300">Asignada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-slate-300">En Proceso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-slate-300">Finalizada</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      delay: 0.1,
                      duration: 0.3
                    }
                  }}
                >
                  <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm hover:border-orange-500/30 transition-colors">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500/20' :
                          task.status === 'in-progress' ? 'bg-orange-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-white mb-2">{task.title}</h3>
                          <p className="text-sm text-slate-300 mb-4">{task.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 text-slate-300"
                            >
                              Actualizar Estado
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TaskList;