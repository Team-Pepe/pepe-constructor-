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
import { fetchAllDashboardData } from "@/services/dashboardService";
import Inventory from "./inventory";

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [projects, setProjects] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [activities, setActivities] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [activeSection, setActiveSection] = useState("resumen");

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const data = await fetchAllDashboardData();
                
                setMetrics(data.metrics);
                setProjects(data.projects);
                setAttendance(data.attendance);
                setMaterials(data.materials);
                setActivities(data.activities);
                setWorkers(data.workers);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
        // Actualizar datos cada 5 minutos
        const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const renderMainContent = () => {
        switch (activeSection) {
            case "inventario":
                return <Inventory />;
            case "resumen":
            default:
                return (
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
                                            Inventario
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
                                                    used={material.used || 0}
                                                    total={material.quantity}
                                                    unit={"Unidades"}
                                                />
                                            ))}
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
                        <Button variant="outline" className="text-white border-white/30 bg-transparent hover:bg-white/10 hover:text-orange-400 hover:border-orange-500/50">
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
                                <nav className="space-y-2">
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
