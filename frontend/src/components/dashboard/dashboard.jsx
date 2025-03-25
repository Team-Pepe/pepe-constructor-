import React, { useEffect, useState } from "react";
import {
    Activity,
    AlertCircle,
    BarChart3,
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PropTypes from 'prop-types';

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);
    const [projects, setProjects] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [metricsRes, projectsRes, attendanceRes, materialsRes, activitiesRes] = await Promise.all([
                    fetch('http://localhost:3000/api/dashboard/metrics'),
                    fetch('http://localhost:3000/api/dashboard/projects-progress'),
                    fetch('http://localhost:3000/api/dashboard/attendance'),
                    fetch('http://localhost:3000/api/dashboard/materials'),
                    fetch('http://localhost:3000/api/dashboard/recent-activities')
                ]);

                const [metricsData, projectsData, attendanceData, materialsData, activitiesData] = await Promise.all([
                    metricsRes.json(),
                    projectsRes.json(),
                    attendanceRes.json(),
                    materialsRes.json(),
                    activitiesRes.json()
                ]);

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
                                    value={metrics?.workers || '0'}
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

// Component for nav items
function NavItem({ icon: Icon, label, active }) {
    return (
        <Button
            variant="ghost"
            className={`w-full justify-start ${
                active
                    ? "bg-slate-800/70 text-orange-400"
                    : "text-slate-400 hover:text-slate-100"
            }`}
        >
            <Icon className="mr-2 h-4 w-4" />
            {label}
        </Button>
    );
}

// PropTypes para todos los componentes
NavItem.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    active: PropTypes.bool
};

// Component for metric cards
function MetricCard({ title, value, icon: Icon, color, detail }) {
    const getColor = () => {
        switch (color) {
            case "cyan":
                return "from-orange-500 to-amber-500 border-orange-500/30";
            case "green":
                return "from-green-500 to-emerald-500 border-green-500/30";
            case "blue":
                return "from-blue-500 to-indigo-500 border-blue-500/30";
            case "purple":
                return "from-purple-500 to-pink-500 border-purple-500/30";
            default:
                return "from-cyan-500 to-blue-500 border-cyan-500/30";
        }
    };

    return (
        <div
            className={`bg-slate-800/50 rounded-lg border ${getColor()} p-4 relative overflow-hidden`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-400">{title}</div>
                <Icon className={`h-5 w-5 text-${color}-500`} />
            </div>
            <div className="text-2xl font-bold mb-1 bg-gradient-to-r bg-clip-text text-transparent from-slate-100 to-slate-300">
                {value}
            </div>
            <div className="text-xs text-slate-500">{detail}</div>
        </div>
    );
}

MetricCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired,
    detail: PropTypes.string.isRequired
};

// Component for work progress cards
function WorkProgressCard({ title, progress, workers, tasks }) {
    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <Badge variant="outline" className="bg-slate-700/50 text-slate-300">
                    {progress}% Completado
                </Badge>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex justify-between text-sm text-slate-400">
                <div>{workers} trabajadores</div>
                <div>{tasks} tareas pendientes</div>
            </div>
        </div>
    );
}

WorkProgressCard.propTypes = {
    title: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    workers: PropTypes.number.isRequired,
    tasks: PropTypes.number.isRequired
};

// Component for attendance cards
function AttendanceCard({ name, role, status, time }) {
    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Avatar>
                        <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-slate-400">{role}</div>
                    </div>
                </div>
                <div className="text-right">
                    <Badge
                        variant="outline"
                        className={`${
                            status === "Presente"
                                ? "bg-green-500/20 text-green-400 border-green-500/50"
                                : "bg-red-500/20 text-red-400 border-red-500/50"
                        }`}
                    >
                        {status}
                    </Badge>
                    <div className="text-sm text-slate-400 mt-1">{time}</div>
                </div>
            </div>
        </div>
    );
}

AttendanceCard.propTypes = {
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    time: PropTypes.string
};

// Component for material cards
function MaterialCard({ name, used, total, unit }) {
    const percentage = (used / total) * 100;
    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{name}</h3>
                <Badge variant="outline" className="bg-slate-700/50 text-slate-300">
                    {percentage.toFixed(0)}% Usado
                </Badge>
            </div>
            <Progress value={percentage} className="h-2 mb-2" />
            <div className="flex justify-between text-sm text-slate-400">
                <div>{used} {unit} usados</div>
                <div>{total - used} {unit} disponibles</div>
            </div>
        </div>
    );
}

MaterialCard.propTypes = {
    name: PropTypes.string.isRequired,
    used: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired
};

// Component for action buttons
function ActionButton({ icon: Icon, label }) {
    return (
        <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center text-slate-100 hover:text-orange-400"
        >
            <Icon className="h-6 w-6 mb-2" />
            <span className="text-xs">{label}</span>
        </Button>
    );
}

ActionButton.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired
};

// Component for activity items
function ActivityItem({ title, time, description }) {
    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{title}</h3>
                <span className="text-sm text-slate-400">{time}</span>
            </div>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
    );
}

ActivityItem.propTypes = {
    title: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
};
