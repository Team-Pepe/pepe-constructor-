import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    Calendar,
    ClipboardList,
    FileText,
    HardDrive,
    MessageSquare,
    Settings,
    Users,
    MapPin,
    AlertTriangle,
    LogOut,
    PackageOpen,
    UserCog, // Añade este nuevo ícono
    Clock,
    Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
    NavItem,
    MetricCard,
    WorkProgressCard,
    AttendanceCard,
    MaterialCard,
    ActionButton,
    ActivityItem,
    MaterialRequestsCard
} from "./components";

import WorkZoneMap from "@/components/ui/WorkZoneMap/WorkZoneMap";
import { fetchAllDashboardData, updateUserLocation, fetchWorkZones } from "@/services/dashboardService";
import { useAuth } from "@/features/auth";
import Inventory from "./inventory";
import UsersManagement from "./UsersManagement";
import Reports from "./reports"; // Importar el componente de Reportes
import { ChatModal } from "@/components/chat/ChatModal";

export default function Dashboard() {
    const { roleId } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [projects, setProjects] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [activities, setActivities] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [activeSection, setActiveSection] = useState("resumen");
    const [locationStatus, setLocationStatus] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
    const [selectedZoneFilter, setSelectedZoneFilter] = useState("");
    const [loadingCheckins, setLoadingCheckins] = useState(true);
    const [checkinsPorZona, setCheckinsPorZona] = useState({});
    const [zonasDisponiblesMap, setZonasDisponiblesMap] = useState({});
    const [searchEmployeeName, setSearchEmployeeName] = useState("");

    // Estados para el chat
    const [showChatModal, setShowChatModal] = useState(false);
    const [workZones, setWorkZones] = useState([]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Función para procesar actividades y formatear fechas
    const processActivities = (activities) => {
        if (!Array.isArray(activities)) {
            console.warn("Activities no es un array:", activities);
            activities = [];
        }

        // Si no hay actividades, generar algunas de ejemplo basadas en solicitudes de materiales recientes
        if (activities.length === 0) {
            console.log("📝 No hay actividades, generando ejemplos basados en solicitudes recientes...");
            const now = new Date();
            const exampleActivities = [
                {
                    id: "ejemplo-1",
                    title: "Solicitud de Material",
                    description: "Mordecai solicitó 10 unidades de pollo frisby",
                    created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // Hace 5 minutos
                    type: "material_request",
                    status: "pending"
                },
                {
                    id: "ejemplo-2", 
                    title: "Solicitud de Material",
                    description: "Mordecai solicitó 323 unidades de frisby",
                    created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // Hace 15 minutos
                    type: "material_request", 
                    status: "pending"
                }
            ];
            activities = exampleActivities;
        }

        return activities.map((activity, index) => {
            // Función para formatear fecha robusta
            const formatActivityDate = (activityData) => {
                // Intentar diferentes campos de fecha
                const possibleDateFields = [
                    activityData.created_at,
                    activityData.createdAt,
                    activityData.date_created,
                    activityData.dateCreated,
                    activityData.fecha_creacion,
                    activityData.timestamp,
                    activityData.fecha,
                    activityData.time,
                    activityData.updated_at,
                    activityData.updatedAt
                ];

                // Buscar el primer campo de fecha válido
                for (const dateField of possibleDateFields) {
                    if (dateField) {
                        try {
                            const date = new Date(dateField);
                            if (!isNaN(date.getTime())) {
                                return date.toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            }
                        } catch (error) {
                            console.warn("Error parsing date:", dateField, error);
                        }
                    }
                }

                // Si no se encuentra fecha válida, asignar una fecha estimada
                const fallbackDate = new Date();
                fallbackDate.setMinutes(fallbackDate.getMinutes() - index);
                return fallbackDate.toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };

            return {
                ...activity,
                id: activity.id || `activity-${index}`,
                title: activity.title || activity.nombre || activity.name || "Actividad sin título",
                description: activity.description || activity.descripcion || activity.message || "Sin descripción",
                time: formatActivityDate(activity)
            };
        });
    };

    // Mostrar modal de solicitud de ubicación si el usuario es trabajador
    useEffect(() => {
        if (roleId === 2) {
            console.log("Usuario es trabajador (roleId=2), mostrando modal de ubicación");
            setShowLocationModal(true);
        } else {
            console.log("Usuario NO es trabajador (roleId=" + roleId + "), ocultando modal");
            setShowLocationModal(false);
        }
    }, [roleId]);

    // Función para solicitar permiso de ubicación
    const requestLocationPermission = () => {
        if (!navigator.geolocation) {
            setLocationStatus('Tu navegador no soporta geolocalización');
            return;
        }

        setLocationStatus('Solicitando acceso a ubicación...');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log('Ubicación obtenida:', { latitude, longitude });
                    
                    await updateUserLocation({ latitude, longitude });
                    setLocationStatus('Ubicación actualizada correctamente');
                    setShowLocationModal(false);
                    
                    // Actualizar la lista de trabajadores después de enviar la ubicación
                    loadDashboardData();
                    
                    // Configurar intervalo para actualizar la ubicación cada 5 minutos
                    const locationInterval = setInterval(() => updateLocation(), 5 * 60 * 1000);
                    
                    // Limpiar el mensaje después de 3 segundos
                    setTimeout(() => setLocationStatus(null), 3000);
                    
                    // Devolver la función para limpiar el intervalo
                    return () => clearInterval(locationInterval);
                } catch (error) {
                    console.error('Error al enviar ubicación:', error);
                    setLocationStatus('Error al actualizar ubicación');
                    setTimeout(() => setLocationStatus(null), 5000);
                }
            },
            (error) => {
                console.error('Error al obtener ubicación:', error);
                
                // Marcar que el permiso fue denegado
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationPermissionDenied(true);
                }
                
                // Mensajes personalizados según el error
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationStatus('Se requiere permiso para acceder a la ubicación');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationStatus('Información de ubicación no disponible');
                        break;
                    case error.TIMEOUT:
                        setLocationStatus('Tiempo de espera agotado para obtener ubicación');
                        break;
                    default:
                        setLocationStatus('Error desconocido al obtener ubicación');
                }
                
                // Mantener el mensaje de error por 5 segundos
                setTimeout(() => setLocationStatus(null), 5000);
            },
            { enableHighAccuracy: true }
        );
    };

    // Función para actualizar la ubicación
    const updateLocation = () => {
        if (!navigator.geolocation || locationPermissionDenied) return;
        
        setLocationStatus('Actualizando ubicación...');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log('Ubicación obtenida:', { latitude, longitude });
                    
                    await updateUserLocation({ latitude, longitude });
                    setLocationStatus('Ubicación actualizada');
                    
                    // Actualizar la lista de trabajadores después de enviar la ubicación
                    loadDashboardData();
                    
                    // Limpiar el mensaje después de 2 segundos
                    setTimeout(() => setLocationStatus(null), 2000);
                } catch (error) {
                    console.error('Error al enviar ubicación:', error);
                    setLocationStatus('Error al actualizar ubicación');
                    setTimeout(() => setLocationStatus(null), 5000);
                }
            },
            (error) => {
                console.error('Error al obtener ubicación:', error);
                setLocationStatus('Error al obtener ubicación');
                setTimeout(() => setLocationStatus(null), 5000);
            },
            { enableHighAccuracy: true }
        );
    };

    // Función para agregar una nueva actividad inmediatamente
    const addActivity = (newActivity) => {
        const activityWithDefaults = {
            id: `local-${Date.now()}`,
            title: newActivity.title || "Nueva Actividad",
            description: newActivity.description || "Sin descripción",
            time: new Date().toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            type: "local_action",
            isTemporary: true, // Marcar como temporal
            timestamp: Date.now(), // Para poder filtrar por tiempo
            ...newActivity
        };

        console.log("🆕 Agregando nueva actividad:", activityWithDefaults);
        
        // Agregar la nueva actividad al principio de la lista
        setActivities(prevActivities => [activityWithDefaults, ...(prevActivities || [])]);
        
        // Limpiar actividades temporales después de 5 minutos
        setTimeout(() => {
            setActivities(prevActivities => 
                (prevActivities || []).filter(activity => 
                    !activity.isTemporary || (Date.now() - activity.timestamp) < 5 * 60 * 1000
                )
            );
        }, 5 * 60 * 1000); // 5 minutos
    };

    // Extraer la función loadDashboardData para poder llamarla desde otros lugares
    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            const data = await fetchAllDashboardData();
            
            // Cargar zonas de trabajo para el chat
            try {
                const workZonesResponse = await fetchWorkZones();
                if (workZonesResponse?.data) {
                    setWorkZones(workZonesResponse.data);
                }
            } catch (error) {
                console.error('Error al cargar zonas de trabajo para chat:', error);
            }
            
            setMetrics(data.metrics);
            setProjects(data.projects || []);
            setAttendance(data.attendance || []);
            setMaterials(data.materials || []);
            // Procesar actividades y asegurar que tengan fechas formateadas
            console.log("🔍 Datos originales de actividades:", data.activities);
            
            // Si no hay actividades del endpoint, crear actividades basadas en solicitudes de materiales
            let activitiesToProcess = data.activities || [];
            if ((!activitiesToProcess || activitiesToProcess.length === 0) && data.materialRequests && data.materialRequests.length > 0) {
                console.log("🔄 Convirtiendo solicitudes de materiales en actividades...");
                activitiesToProcess = data.materialRequests.slice(0, 5).map(request => ({
                    id: `material-request-${request.id}`,
                    title: "Solicitud de Material",
                    description: `${request.user?.username || 'Empleado'} solicitó ${request.quantity_requested} unidades de ${request.material}`,
                    created_at: request.created_at || request.createdAt || new Date().toISOString(),
                    type: "material_request",
                    status: request.status || "pending",
                    original_request: request
                }));
            }
            
            const processedActivities = processActivities(activitiesToProcess);
            console.log("✅ Actividades procesadas:", processedActivities);
            
            // Conservar actividades temporales locales (recientes)
            setActivities(prevActivities => {
                const temporaryActivities = (prevActivities || []).filter(activity => 
                    activity.isTemporary && (Date.now() - activity.timestamp) < 2 * 60 * 1000 // Últimos 2 minutos
                );
                
                // Combinar actividades temporales con las nuevas del servidor
                const combinedActivities = [...temporaryActivities, ...processedActivities];
                
                console.log("🔄 Combinando actividades:", {
                    temporales: temporaryActivities.length,
                    servidor: processedActivities.length,
                    total: combinedActivities.length
                });
                
                // Limitar a 15 actividades máximo y eliminar duplicados por descripción
                const uniqueActivities = combinedActivities
                    .filter((activity, index, self) => 
                        index === self.findIndex(a => a.description === activity.description)
                    )
                    .slice(0, 15);
                
                return uniqueActivities;
            });
            setWorkers(data.workers || []);
            
            console.log("Actualizando datos de check-ins en dashboard. Zonas disponibles:", Object.keys(data.checkinsPorZona || {}));
            
            // Actualizar el estado de check-ins
            if (data.checkinsPorZona && Object.keys(data.checkinsPorZona).length > 0) {
                setCheckinsPorZona(data.checkinsPorZona);
            } else {
                console.warn("No se encontraron check-ins para mostrar");
                // Usar datos de muestra si no hay check-ins
                setCheckinsPorZona({
                    "Datos de Ejemplo": [
                        {
                            id: 1,
                            employee_name: "Empleado Ejemplo",
                            zone_name: "Zona Ejemplo",
                            check_in_time: new Date().toLocaleDateString() + ", " + new Date().toLocaleTimeString(),
                            check_out_time: null
                        }
                    ]
                });
            }
            
            setZonasDisponiblesMap(data.zonasDisponiblesMap || {});

            // Actualizar el estado de carga de check-ins
            setLoadingCheckins(false);
            
            console.log("Solicitudes de materiales cargadas:", data.materialRequests);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            
            // Incluso si hay error, terminar la carga
            setLoadingCheckins(false);
            
            // Usar datos de muestra si hay error
            if (Object.keys(checkinsPorZona).length === 0) {
                setCheckinsPorZona({
                    "Datos de Muestra (Error)": [
                        {
                            id: 999,
                            employee_name: "Error en la carga de datos",
                            zone_name: "Contacte al administrador",
                            check_in_time: new Date().toLocaleDateString() + ", " + new Date().toLocaleTimeString(),
                            check_out_time: null
                        }
                    ]
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
        
        // Actualizar datos cada 2 minutos para tener ubicaciones más recientes
        const interval = setInterval(loadDashboardData, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Renderizar el modal de ubicación
    const renderLocationModal = () => {
        if (!showLocationModal) return null;
        
        console.log("Renderizando modal de ubicación");
        
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
                <div className="bg-slate-800 border-2 border-orange-500 p-6 rounded-lg max-w-md w-full shadow-xl">
                    <div className="flex items-center justify-center text-orange-500 mb-4">
                        <MapPin size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center mb-4">
                        Acceso a ubicación requerido
                    </h2>
                    <p className="text-slate-300 mb-6 text-center">
                        Para poder utilizar el sistema correctamente, necesitamos acceder a tu ubicación. 
                        Esto nos permite ubicarte en el mapa de trabajo y gestionar la asignación de tareas.
                    </p>
                    
                    {locationPermissionDenied && (
                        <div className="bg-red-900/50 border border-red-500 rounded-md p-4 mb-4">
                            <div className="flex items-start">
                                <AlertTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" size={20} />
                                <p className="text-red-200 text-sm">
                                    Has rechazado el permiso de ubicación. Por favor, habilita los permisos de ubicación en la configuración de tu navegador y recarga la página.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col space-y-4">
                        <Button 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3"
                            onClick={requestLocationPermission}
                            disabled={locationPermissionDenied}
                            size="lg"
                        >
                            <MapPin className="mr-2 h-5 w-5" />
                            Permitir acceso a ubicación
                        </Button>
                        
                        {locationPermissionDenied && (
                            <Button
                                variant="outline"
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                                onClick={() => setShowLocationModal(false)}
                            >
                                Continuar sin ubicación
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderMainContent = () => {
        switch (activeSection) {
            case "inventario":
                return (
                    <motion.section 
                        id="inventario"
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
                        <motion.h2 
                            className="text-2xl font-bold mb-4 px-4 py-2 bg-slate-800/90 rounded-lg text-white inline-block"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: {
                                    duration: 0.3,
                                    ease: "easeOut"
                                }
                            }}
                        >
                            Inventario de Materiales
                        </motion.h2>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1,
                                transition: {
                                    delay: 0.1,
                                    duration: 0.3
                                }
                            }}
                        >
                            <Inventory />
                        </motion.div>
                    </motion.section>
                );
            case "solicitudes":
                return (
                    <div className="grid gap-6">
                        <h2 className="text-xl font-bold">Solicitudes de Materiales</h2>
                        <MaterialRequestsCard onRefresh={loadDashboardData} onActivityAdd={addActivity} />
                    </div>
                );
            case "reportes":
                return (
                    <motion.section 
                        id="reportes"
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
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: {
                                    duration: 0.3,
                                    ease: "easeOut"
                                }
                            }}
                        >
                            <Reports />
                        </motion.div>
                    </motion.section>
                );
            case "asistencia":
                return (
                    <motion.div 
                        className="grid gap-6"
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
                        <div className="grid gap-6">
                            <Card className="bg-slate-800 border-slate-700 shadow-md">
                                <motion.div
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
                                    <CardHeader className="bg-slate-900 border-b border-slate-700">
                                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                            <Clock className="h-6 w-6 text-orange-400" />
                                            Gestión de Check-ins
                                        </CardTitle>
                                    </CardHeader>
                                </motion.div>
                                <CardContent className="p-0">
                                    {/* Mantener el contenido existente */}
                                    <div className="p-4 flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <label className="font-medium text-white">Filtrar por zona:</label>
                                            <select
                                                className="p-2 border rounded bg-slate-700 text-white border-slate-600"
                                                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                                            >
                                                <option value="">Todas</option>
                                                {Object.keys(checkinsPorZona).map(zona => (
                                                    <option key={zona} value={zona}>{zona}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <label className="font-medium text-white">Buscar empleado:</label>
                                            <input
                                                type="text"
                                                placeholder="Nombre de empleado..."
                                                className="p-2 border rounded bg-slate-700 text-white border-slate-600"
                                                value={searchEmployeeName}
                                                onChange={(e) => setSearchEmployeeName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    {Object.keys(checkinsPorZona)
                                        .filter(zona => !selectedZoneFilter || zona === selectedZoneFilter)
                                        .map(zona => {
                                            console.log(`Procesando zona: ${zona} con ${checkinsPorZona[zona]?.length || 0} check-ins`);
                                            
                                            // Filtrar por nombre de empleado si hay búsqueda
                                            const filteredCheckins = searchEmployeeName
                                                ? checkinsPorZona[zona].filter(checkin => 
                                                    checkin.employee_name && 
                                                    checkin.employee_name.toLowerCase().includes(searchEmployeeName.toLowerCase()))
                                                : checkinsPorZona[zona];
                                                    
                                            if (filteredCheckins.length === 0) return null;
                                            
                                            return (
                                                <div key={zona} className="mb-6">
                                                    <h3 className="font-bold text-lg mb-2 px-4 text-orange-400">Zona: {zona}</h3>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="border-b border-slate-700">
                                                                    <th className="text-left p-2 text-slate-300">Empleado</th>
                                                                    <th className="text-left p-2 text-slate-300">Zona</th>
                                                                    <th className="text-left p-2 text-slate-300">Fecha</th>
                                                                    <th className="text-left p-2 text-slate-300">Hora de Check-in</th>
                                                                    <th className="text-left p-2 text-slate-300">Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {loadingCheckins ? (
                                                                    <tr>
                                                                        <td colSpan="5" className="text-center p-4">
                                                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                                        </td>
                                                                    </tr>
                                                                ) : filteredCheckins.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan="5" className="text-center p-4 text-slate-400">
                                                                            No hay check-ins que coincidan con los criterios de búsqueda
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    filteredCheckins.map((checkin) => {
                                                                        console.log("Renderizando check-in:", checkin);
                                                                        
                                                                        // Formatear fecha y hora
                                                                        let fechaHora = null;
                                                                        let fechaStr = "-";
                                                                        let horaStr = "-";
                                                                        
                                                                        if (checkin.check_in_time) {
                                                                            try {
                                                                                // Intentar formatear según el formato que venga
                                                                                if (checkin.check_in_time.includes('/')) {
                                                                                    // Ya está en formato DD/MM/YYYY
                                                                                    const partes = checkin.check_in_time.split(', ');
                                                                                    if (partes.length > 1) {
                                                                                        fechaStr = partes[0];
                                                                                        horaStr = partes[1];
                                                                                    } else {
                                                                                        fechaStr = checkin.check_in_time;
                                                                                    }
                                                                                } else {
                                                                                    // Formato ISO o timestamp
                                                                                    fechaHora = new Date(checkin.check_in_time);
                                                                                    if (!isNaN(fechaHora.getTime())) {
                                                                                        fechaStr = fechaHora.toLocaleDateString();
                                                                                        horaStr = fechaHora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                                                                    }
                                                                                }
                                                                            } catch (error) {
                                                                                console.error("Error formateando fecha:", error);
                                                                            }
                                                                        }
                                                                        
                                                                        return (
                                                                            <tr key={checkin.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                                                                <td className="p-2 text-white">{checkin.employee_name || "Sin nombre"}</td>
                                                                                <td className="p-2 text-white">
                                                                                    {(checkin.zone_name && !checkin.zone_name.startsWith('Zona ')) 
                                                                                        ? checkin.zone_name 
                                                                                        : (zonasDisponiblesMap[checkin.zone_id] || checkin.zoneName || checkin.zone?.name || zona || '-')
                                                                                    }
                                                                                </td>
                                                                                <td className="p-2 text-white">{fechaStr}</td>
                                                                                <td className="p-2 text-white">{horaStr}</td>
                                                                                <td className="p-2">
                                                                                    <span className={`px-2 py-1 rounded text-sm ${
                                                                                        !checkin.check_out_time ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                                                                                    }`}>
                                                                                        {!checkin.check_out_time ? 'Activo' : 'Terminado'}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                );
            case "users-management":
                return roleId === 4 ? (
                    <motion.section 
                        id="users-management"
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
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: {
                                    duration: 0.3,
                                    ease: "easeOut"
                                }
                            }}
                        >
                            <UsersManagement />
                        </motion.div>
                    </motion.section>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1,
                            transition: {
                                duration: 0.3
                            }
                        }}
                        className="text-center py-8 text-slate-400"
                    >
                        No tienes permisos para acceder a esta sección
                    </motion.div>
                );
            case "resumen":
            default:
                return (
                    <motion.div 
                        className="grid gap-6"
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
                        {/* Overview cards with staggered animation */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            { [
                                {
                                    title: "Obras Activas",
                                    value: `${projects.length}`,
                                    icon: Activity,
                                    color: "cyan",
                                    detail: `${projects.length} en progreso`
                                },
                                {
                                    title: "Trabajadores",
                                    value: workers?.length || '0',
                                    icon: Users,
                                    color: "purple",
                                    detail: `${workers?.length} presentes`
                                },
                                {
                                    title: "Tareas",
                                    value: `${metrics?.tasks || '0'}`,
                                    icon: ClipboardList,
                                    color: "blue",
                                    detail: `${projects.reduce((acc, p) => acc + p.tasks, 0)} pendientes`
                                }
                            ].map((metric, index) => (
                                <motion.div
                                    key={metric.title}
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ 
                                        opacity: 1, 
                                        scale: 1,
                                        y: 0,
                                        transition: {
                                            delay: index * 0.1,
                                            duration: 0.3,
                                            type: "spring",
                                            damping: 25,
                                            stiffness: 300
                                        }
                                    }}
                                >
                                    <MetricCard {...metric} />
                                </motion.div>
                            )) }
                        </div>

                        {/* Work Zone Map with animation */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: {
                                    delay: 0.3,
                                    duration: 0.5
                                }
                            }}
                        >
                            <WorkZoneMap workers={workers || []} />
                        </motion.div>

                        {/* Tabs section */}
                        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                            <Tabs defaultValue="overview" className="w-full">
                                <CardHeader className="border-b border-slate-700/50 pb-3">
                                    <TabsList className="bg-slate-800/50 p-1">
                                        <TabsTrigger
                                            value="overview"
                                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400"
                                        >
                                            Resumen
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="attendance"
                                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400"
                                        >
                                            Asistencia
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="materials"
                                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400"
                                        >
                                            Inventario
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="requests"
                                            className="data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400"
                                        >
                                            Solicitudes
                                        </TabsTrigger>
                                    </TabsList>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <TabsContent value="overview">
                                        <div className="space-y-4">
                                            {projects && projects.length > 0 ? (
                                                projects.map(project => (
                                                    <WorkProgressCard
                                                        key={project.id}
                                                        title={project.title}
                                                        progress={project.progress}
                                                        workers={project.workers}
                                                        tasks={project.tasks}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-slate-400">
                                                    No hay proyectos activos
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="attendance">
                                        <div className="space-y-4">
                                            {attendance && attendance.length > 0 ? (
                                                attendance.map(record => (
                                                    <AttendanceCard
                                                        key={record.id}
                                                        name={record.name}
                                                        role={record.role}
                                                        status={record.status}
                                                        time={record.time}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-slate-400">
                                                    No hay registros de asistencia
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="materials">
                                        <div className="space-y-4">
                                            {materials && materials.length > 0 ? (
                                                materials.map(material => (
                                                    <MaterialCard
                                                        key={material.id}
                                                        name={material.name}
                                                        used={material.used || 0}
                                                        total={material.quantity}
                                                        unit={"Unidades"}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center py-4 text-slate-400">
                                                    No hay materiales disponibles
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="requests">
                                        <div className="space-y-4">
                                            <MaterialRequestsCard onRefresh={loadDashboardData} />
                                        </div>
                                    </TabsContent>
                                </CardContent>
                            </Tabs>
                        </Card>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-900 to-slate-900 text-slate-100 p-6">
            {/* Mostrar mensaje de estado de ubicación si existe */}
            {locationStatus && (
                <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-orange-500/50 text-white px-4 py-2 rounded-md shadow-lg">
                    {locationStatus}
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Dashboard de Supervisión</h1>
                    <div className="flex items-center space-x-4">
                        <Button 
                            variant="outline" 
                            className="text-white border-white/30 bg-transparent hover:bg-white/10 hover:text-orange-400 hover:border-orange-500/50"
                            onClick={() => setShowChatModal(true)}
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Mensajes
                        </Button>
                        <Button variant="outline" className="text-white border-white/30 bg-transparent hover:bg-white/10 hover:text-orange-400 hover:border-orange-500/50">
                            <Settings className="mr-2 h-4 w-4" />
                            Configuración
                        </Button>
                    </div>
                </div>

                {/* Main content */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="col-span-12 md:col-span-3 lg:col-span-2">
                        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm h-full">
                            <CardContent className="p-4">
                                <nav className="flex flex-col h-full justify-between">
                                    <div className="space-y-2">
                                        <NavItem 
                                            icon={Activity} 
                                            label="Resumen" 
                                            active={activeSection === "resumen"}
                                            onClick={() => setActiveSection("resumen")}
                                        />
                                        <NavItem 
                                            icon={Users} 
                                            label="Asistencia"
                                            active={activeSection === "asistencia"}
                                            onClick={() => setActiveSection("asistencia")}
                                        />
                                        <NavItem 
                                            icon={HardDrive} 
                                            label="Inventario"
                                            active={activeSection === "inventario"}
                                            onClick={() => setActiveSection("inventario")}
                                        />
                                        <NavItem 
                                            icon={PackageOpen} 
                                            label="Solicitudes"
                                            active={activeSection === "solicitudes"}
                                            onClick={() => setActiveSection("solicitudes")}
                                        />
                                        <NavItem 
                                            icon={ClipboardList} 
                                            label="Tareas"
                                            active={activeSection === "tareas"}
                                            onClick={() => setActiveSection("tareas")}
                                        />
                                        <NavItem 
                                            icon={Calendar} 
                                            label="Calendario"
                                            active={activeSection === "calendario"}
                                            onClick={() => setActiveSection("calendario")}
                                        />
                                        <NavItem 
                                            icon={FileText} 
                                            label="Reportes"
                                            active={activeSection === "reportes"}
                                            onClick={() => setActiveSection("reportes")}
                                        />
                                        <NavItem 
                                            icon={UserCog}
                                            label="Gestión Usuarios"
                                            active={activeSection === "users-management"}
                                            onClick={() => setActiveSection("users-management")}
                                            className={roleId === 4 ? "block" : "hidden"} // Solo visible para admin
                                        />
                                    </div>
                                    
                                    {/* Botón de Cerrar Sesión */}
                                    <div className="pt-4 mt-4 border-t border-slate-700/50">
                                        <NavItem 
                                            icon={LogOut} 
                                            label="Cerrar Sesión"
                                            onClick={handleLogout}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                        />
                                    </div>
                                </nav>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main dashboard content - Cambia según la sección activa */}
                    <div className="col-span-12 md:col-span-9 lg:col-span-7">
                        {renderMainContent()}
                    </div>

                    {/* Right sidebar */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="grid gap-6">
                            {/* Quick actions */}
                            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-slate-100 text-base">
                                        Acciones Rápidas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3">
                                        <ActionButton icon={ClipboardList} label="Nueva Tarea" />
                                        <ActionButton icon={FileText} label="Generar Reporte" />
                                        <ActionButton icon={Users} label="Registrar Asistencia" />
                                        <ActionButton 
                                            icon={HardDrive} 
                                            label="Gestionar Inventario" 
                                            onClick={() => setActiveSection("inventario")}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent activities */}
                            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardTitle className="text-slate-100 text-base">
                                        Actividades Recientes
                                    </CardTitle>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={loadDashboardData}
                                        className="text-slate-400 hover:text-white hover:bg-slate-700 p-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Activity className="h-4 w-4" />
                                        )}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {(activities || []).length === 0 ? (
                                            <div className="text-center text-slate-400 py-4">
                                                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No hay actividades recientes</p>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={loadDashboardData}
                                                    className="mt-2 border-slate-600 text-slate-300 hover:bg-slate-700"
                                                    disabled={isLoading}
                                                >
                                                    Actualizar
                                                </Button>
                                            </div>
                                        ) : (
                                            (activities || []).map(activity => (
                                                <ActivityItem
                                                    key={activity.id}
                                                    title={activity.title}
                                                    time={activity.time}
                                                    description={activity.description}
                                                    type={activity.type}
                                                    status={activity.status}
                                                />
                                            )))
                                        }
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Renderizar el modal de ubicación */}
            {renderLocationModal()}

            {/* Renderizar el modal de chat */}
            {showChatModal && (
                <ChatModal
                    isOpen={showChatModal}
                    onClose={() => setShowChatModal(false)}
                    workZones={workZones}
                />
            )}
        </div>
    );
}
