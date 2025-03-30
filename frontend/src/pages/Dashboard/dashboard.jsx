import React, { useEffect, useState } from "react";
import {
    Activity,
    Calendar,
    ClipboardList,
    FileText,
    HardDrive,
    MessageSquare,
    Settings,
    Users,
} from "lucide-react";

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
    ActivityItem
} from "./components";

import WorkZoneMap from "@/components/ui/WorkZoneMap/WorkZoneMap";

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [projects, setProjects] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [activities, setActivities] = useState([]);
    const [workers, setWorkers] = useState([]);

    const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
    console.log(apiEndpoint);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [metricsRes, projectsRes, attendanceRes, materialsRes, activitiesRes, workersRes] = await Promise.all([
                    fetch(`${apiEndpoint}/api/dashboard/metrics`),
                    fetch(`${apiEndpoint}/api/dashboard/projects-progress`),
                    fetch(`${apiEndpoint}/api/dashboard/attendance`),
                    fetch(`${apiEndpoint}/api/dashboard/materials`),
                    fetch(`${apiEndpoint}/api/dashboard/recent-activities`),
                    fetch(`${apiEndpoint}/api/users?roleId=2`)
                ]);

                const [metricsData, projectsData, attendanceData, materialsData, activitiesData, workersData] = await Promise.all([
                    metricsRes.json(),
                    projectsRes.json(),
                    attendanceRes.json(),
                    materialsRes.json(),
                    activitiesRes.json(),
                    workersRes.json()
                ]);
                console.info("USUARIOS", workersData);
                
                // Datos de ubicación fijas para los trabajadores en Pereira
                const addLocationToWorkers = (workers) => {
                    if (!workers) return [];
                    
                    // Coordenadas de trabajadores en diferentes puntos de Pereira
                    const fixedLocations = [
                        { lat: 4.8133, lng: -75.6961 }, // Centro de Pereira
                        { lat: 4.8182, lng: -75.6923 }, // Cerca del centro
                        { lat: 4.8056, lng: -75.7056 }, // Zona oeste
                        { lat: 4.8240, lng: -75.6845 }, // Zona norte
                        { lat: 4.8050, lng: -75.6845 }, // Zona sur
                        { lat: 4.8150, lng: -75.7100 }  // Zona oeste
                    ];
                    
                    return workers.map((worker, index) => ({
                        ...worker,
                        name: worker.username || worker.name || `Trabajador ${index + 1}`,
                        location: fixedLocations[index % fixedLocations.length] // Usa ubicación fija basada en el índice
                    }));
                };
                
                // Añadimos ubicación a los trabajadores
                const workersWithLocation = addLocationToWorkers(workersData);
                setWorkers(workersWithLocation);
                
                setMetrics(metricsData);
                setProjects(projectsData);
                setAttendance(attendanceData);
                setMaterials(materialsData);
                setActivities(activitiesData);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
        // Actualizar datos cada 5 minutos
        const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-900 to-slate-900 text-slate-100 p-6">
            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full animate-ping"></div>
                            <div className="absolute inset-2 border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="mt-4 text-orange-500 font-mono text-sm tracking-wider">
                            CARGANDO DASHBOARD
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Dashboard de Supervisión</h1>
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" className="text-slate-100">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Mensajes
                        </Button>
                        <Button variant="outline" className="text-slate-100">
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
                                <nav className="space-y-2">
                                    <NavItem icon={Activity} label="Resumen" active />
                                    <NavItem icon={Users} label="Asistencia" />
                                    <NavItem icon={HardDrive} label="Materiales" />
                                    <NavItem icon={ClipboardList} label="Tareas" />
                                    <NavItem icon={Calendar} label="Calendario" />
                                    <NavItem icon={FileText} label="Reportes" />
                                </nav>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main dashboard */}
                    <div className="col-span-12 md:col-span-9 lg:col-span-7">
                        <div className="grid gap-6">
                            {/* Overview cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MetricCard
                                    title="Obras Activas"
                                    value={metrics?.activeProjects || '0'}
                                    icon={Activity}
                                    color="cyan"
                                    detail={`${projects.length} en progreso`}
                                />
                                <MetricCard
                                    title="Trabajadores"
                                    value={workers?.length || '0'}
                                    icon={Users}
                                    color="purple"
                                    detail={`${attendance.filter(a => a.status === 'PRESENT').length} presentes`}
                                />
                                <MetricCard
                                    title="Tareas"
                                    value={`${metrics?.tasks || '0'}`}
                                    icon={ClipboardList}
                                    color="blue"
                                    detail={`${projects.reduce((acc, p) => acc + p.tasks, 0)} pendientes`}
                                />
                            </div>

                            {/* Work Zone Map */}
                            <WorkZoneMap workers={workers} />

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
                                                Materiales
                                            </TabsTrigger>
                                        </TabsList>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <TabsContent value="overview">
                                            <div className="space-y-4">
                                                {projects.map(project => (
                                                    <WorkProgressCard
                                                        key={project.id}
                                                        title={project.title}
                                                        progress={project.progress}
                                                        workers={project.workers}
                                                        tasks={project.tasks}
                                                    />
                                                ))}
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="attendance">
                                            <div className="space-y-4">
                                                {attendance.map(record => (
                                                    <AttendanceCard
                                                        key={record.id}
                                                        name={record.name}
                                                        role={record.role}
                                                        status={record.status}
                                                        time={record.time}
                                                    />
                                                ))}
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="materials">
                                            <div className="space-y-4">
                                                {materials.map(material => (
                                                    <MaterialCard
                                                        key={material.id}
                                                        name={material.name}
                                                        used={material.used}
                                                        total={material.total}
                                                        unit={material.unit}
                                                    />
                                                ))}
                                            </div>
                                        </TabsContent>
                                    </CardContent>
                                </Tabs>
                            </Card>
                        </div>
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
                                        <ActionButton icon={HardDrive} label="Solicitar Materiales" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent activities */}
                            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-slate-100 text-base">
                                        Actividades Recientes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {activities.map(activity => (
                                            <ActivityItem
                                                key={activity.id}
                                                title={activity.title}
                                                time={activity.time}
                                                description={activity.description}
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
