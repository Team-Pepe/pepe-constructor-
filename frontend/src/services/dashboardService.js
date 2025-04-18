import axios from 'axios';
import { getAuthToken } from '@/utils/cookies';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

const API_ENDPOINTS = {
  BASE_URL: API_ENDPOINT,
  DASHBOARD_METRICS: '/api/dashboard/metrics',
  PROJECTS_PROGRESS: '/api/dashboard/projects-progress',
  ATTENDANCE: '/api/dashboard/attendance',
  MATERIALS: '/api/materials',
  RECENT_ACTIVITIES: '/api/dashboard/recent-activities',
  USERS: '/api/users',
  WORK_ZONES: '/api/work-zones',
  MATERIAL_ZONE: '/api/material-zone',
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
  const csrfToken = localStorage.getItem('csrfToken');

  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
};


// Dashboard API functions
export const fetchDashboardMetrics = () => 
  apiClient.get(API_ENDPOINTS.DASHBOARD_METRICS, { headers: getAuthHeaders() });

export const fetchProjectsProgress = () => 
  apiClient.get(API_ENDPOINTS.PROJECTS_PROGRESS, { headers: getAuthHeaders() });

export const fetchAttendance = () => 
  apiClient.get(API_ENDPOINTS.ATTENDANCE, { headers: getAuthHeaders() });

export const fetchRecentActivities = () => 
  apiClient.get(API_ENDPOINTS.RECENT_ACTIVITIES, { headers: getAuthHeaders() });

export const fetchWorkers = () => 
  apiClient.get(`${API_ENDPOINTS.USERS}?roleId=2`, { headers: getAuthHeaders() });

export const fetchWorkZones = () =>
  apiClient.get(API_ENDPOINTS.WORK_ZONES, { headers: getAuthHeaders() });

export const createWorkZone = (data) =>
  apiClient.post(API_ENDPOINTS.WORK_ZONES, data, { headers: getAuthHeaders() });

export const updateWorkZone = (id, data) =>
  apiClient.put(`${API_ENDPOINTS.WORK_ZONES}/${id}`, data, { headers: getAuthHeaders() });

export const deleteWorkZone = (id) =>
  apiClient.delete(`${API_ENDPOINTS.WORK_ZONES}/${id}`, { headers: getAuthHeaders() });

// Materials CRUD operations
export const fetchMaterials = () => 
  apiClient.get(API_ENDPOINTS.MATERIALS, { headers: getAuthHeaders() });

export const createMaterial = (formData) => 
  apiClient.post(API_ENDPOINTS.MATERIALS, formData, { 
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  });

export const updateMaterial = (id, data) => 
  apiClient.put(`${API_ENDPOINTS.MATERIALS}/${id}`, data, { 
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    }
  });

export const deleteMaterial = (id) => 
  apiClient.delete(`${API_ENDPOINTS.MATERIALS}/${id}`, { headers: getAuthHeaders() });

// Material Zone operations
export const fetchZoneMaterials = (zoneId) =>
  apiClient.get(`${API_ENDPOINTS.MATERIAL_ZONE}/${zoneId}`, { headers: getAuthHeaders() });

export const assignMaterialsToZone = (data) =>
  apiClient.post(`${API_ENDPOINTS.MATERIAL_ZONE}/assign`, data, { headers: getAuthHeaders() });

export const useMaterialsFromZone = (data) =>
  apiClient.post(`${API_ENDPOINTS.MATERIAL_ZONE}/use`, data, { headers: getAuthHeaders() });

// User location update
export const updateUserLocation = async ({ latitude, longitude }) => {
  try {
    console.log('Enviando ubicación al backend:', { latitude, longitude });
    
    // Obtener los headers de autenticación
    const headers = getAuthHeaders();
    console.log('Headers de autenticación:', headers);
    
    // Datos a enviar
    const data = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };
    
    // Realizar la petición con manejo explícito de errores
    const response = await apiClient.put(`${API_ENDPOINTS.USERS}/location`, data, { 
      headers,
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('Respuesta del servidor:', response.data);
    return response;
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    
    // Información detallada del error para depuración
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('Respuesta de error del servidor:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor:', error.request);
    } else {
      // Error en la configuración de la petición
      console.error('Error en la configuración de la petición:', error.message);
    }
    
    throw error;
  }
};

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
