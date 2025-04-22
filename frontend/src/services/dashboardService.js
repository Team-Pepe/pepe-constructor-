import axios from 'axios';
import { getAuthToken } from '@/utils/cookies';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

const API_ENDPOINTS = {
  BASE_URL: API_ENDPOINT,
  DASHBOARD_METRICS: '/api/dashboard/metrics',
  PROJECTS_PROGRESS: '/api/dashboard/projects-progress',
  ATTENDANCE: '/api/dashboard/attendance',
  MATERIALS: '/api/dashboard/materials',
  RECENT_ACTIVITIES: '/api/dashboard/recent-activities',
  USERS: '/api/users',
  WORK_ZONES: '/api/work-zones',
  MATERIAL_ZONE: '/api/material-assignments',
  MATERIAL_REQUESTS: '/api/material-assignments/request',
  MATERIAL_REQUESTS_ALL: '/api/material-assignments/requests',
};

export const apiClient = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const getAuthHeaders = () => {
  const token = getAuthToken();
  console.log(token);
  
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Dashboard API functions
export const fetchDashboardMetrics = () => 
  apiClient.get(API_ENDPOINTS.DASHBOARD_METRICS, { headers: getAuthHeaders() });

export const fetchProjectsProgress = () => 
  apiClient.get(API_ENDPOINTS.PROJECTS_PROGRESS, { headers: getAuthHeaders() });

export const fetchAttendance = () => 
  apiClient.get(API_ENDPOINTS.ATTENDANCE, { headers: getAuthHeaders() });

export const fetchMaterials = () => 
  apiClient.get(API_ENDPOINTS.MATERIALS, { headers: getAuthHeaders() });

export const fetchRecentActivities = () => 
  apiClient.get(API_ENDPOINTS.RECENT_ACTIVITIES, { headers: getAuthHeaders() });

export const fetchWorkers = () => 
  apiClient.get(`${API_ENDPOINTS.USERS}?roleId=2`, { headers: getAuthHeaders() });

// Function to fetch all dashboard data at once
export const fetchAllDashboardData = async () => {
  try {
    const [
      metricsResponse,
      projectsResponse,
      attendanceResponse,
      materialsResponse,
      activitiesResponse,
      workersResponse
    ] = await Promise.all([
      fetchDashboardMetrics(),
      fetchProjectsProgress(),
      fetchAttendance(),
      fetchMaterials(),
      fetchRecentActivities(),
      fetchWorkers()
    ]);

    return {
      metrics: metricsResponse.data,
      projects: projectsResponse.data,
      attendance: attendanceResponse.data,
      materials: materialsResponse.data,
      activities: activitiesResponse.data,
      workers: addLocationToWorkers(workersResponse.data)
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Helper function to add location to workers
const addLocationToWorkers = (workers) => {
  if (!workers) return [];
  
  // Crear una copia segura de la lista de trabajadores y filtrar solo los que tienen ubicación real
  return workers.map((worker, index) => {
    // Si el trabajador ya tiene una ubicación real (latitude y longitude), usarla
    if (worker.latitude && worker.longitude) {
      return {
        ...worker,
        name: worker.username || worker.name || `Trabajador ${index + 1}`,
        location: {
          lat: parseFloat(worker.latitude),
          lng: parseFloat(worker.longitude)
        },
        // Marcar explícitamente que es una ubicación real
        locationIsSimulated: false
      };
    }
    
    // Si no hay ubicación real, devolver el trabajador sin el campo location
    return {
      ...worker,
      name: worker.username || worker.name || `Trabajador ${index + 1}`
      // No incluir el campo location para que no aparezca en el mapa
    };
  });
};

export default apiClient;
// Material Request operations
export const createMaterialRequest = async (data) => {
  try {
    console.log("Enviando solicitud de materiales:", {
      user_id: data.userId,
      zone_id: data.zoneId,
      message: data.message,
      quantity_requested: parseInt(data.quantityRequested),
      material_id: data.materialId || null
    });
    
    return await apiClient.post(API_ENDPOINTS.MATERIAL_REQUESTS, {
      user_id: data.userId,
      zone_id: data.zoneId,
      message: data.message,
      quantity_requested: parseInt(data.quantityRequested),
      material_id: data.materialId || null
    }, { 
      headers: getAuthHeaders() 
    });
  } catch (error) {
    console.error("Error al crear solicitud de materiales:", error);
    if (error.response) {
      console.error("Respuesta del servidor:", error.response.data);
      console.error("Estado HTTP:", error.response.status);
    }
    throw error;
  }
};

export const fetchMaterialRequests = async (status = null) => {
  try {
    const url = status 
      ? `${API_ENDPOINTS.MATERIAL_REQUESTS_ALL}?status=${status}`
      : API_ENDPOINTS.MATERIAL_REQUESTS_ALL;
    
    console.log(`Solicitando lista de peticiones de materiales${status ? ` con estado ${status}` : ''}...`);
    
    const response = await apiClient.get(url, { 
      headers: getAuthHeaders() 
    });
    
    console.log("Respuesta de API de solicitudes de materiales:", response);
    return response;
  } catch (error) {
    console.error("Error al recuperar solicitudes de materiales:", error);
    if (error.response) {
      console.error("Respuesta de error:", {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
};

export const updateMaterialRequestStatus = async (requestId, status, adminComment = "") => {
  try {
    console.log(`Actualizando estado de solicitud ${requestId} a "${status}"`);
    
    const data = {
      status: status
    };
    
    if (adminComment) {
      data.admin_comment = adminComment;
    }
    
    return await apiClient.patch(`${API_ENDPOINTS.MATERIAL_REQUESTS}/${requestId}/status`, data, { 
      headers: getAuthHeaders() 
    });
  } catch (error) {
    console.error(`Error al actualizar estado de solicitud ${requestId}:`, error);
    if (error.response) {
      console.error("Respuesta del servidor:", error.response.data);
      console.error("Estado HTTP:", error.response.status);
    }
    throw error;
  }
};

