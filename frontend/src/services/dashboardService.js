import axios from 'axios';
import { getAuthToken } from '@/utils/cookies';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

const API_ENDPOINTS = {
  BASE_URL: API_ENDPOINT,
  DASHBOARD_METRICS: '/api/dashboard/metrics',
  PROJECTS_PROGRESS: '/api/dashboard/projects-progress',
  ATTENDANCE: '/api/dashboard/attendance',
  CHECK_IN: '/api/check-in',
  CHECK_INS_RECENT: '/api/check-ins/recent',
  MATERIALS: '/api/materials',
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

export const getAuthHeaders = () => {
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
export const fetchMaterials = async () => { 
  try {
    console.log("Solicitando lista de materiales disponibles...");
    const response = await apiClient.get(API_ENDPOINTS.MATERIALS, { 
      headers: getAuthHeaders() 
    });
    console.log("Respuesta de API de materials:", response);
    return response;
  } catch (error) {
    console.error("Error al recuperar materiales:", error);
    if (error.response) {
      console.error("Respuesta de error:", {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
};

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
export const fetchZoneMaterials = async (zoneId) => {
  try {
    console.log(`Solicitando materiales para la zona ${zoneId}...`);
    const response = await apiClient.get(`${API_ENDPOINTS.MATERIAL_ZONE}/zona/${zoneId}`, { 
      headers: getAuthHeaders() 
    });
    console.log(`Respuesta de API de zona ${zoneId} (completa):`, response);
    console.log(`Estructura de la respuesta de zona ${zoneId}:`, {
      status: response.status,
      headers: response.headers,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataKeys: response.data ? (typeof response.data === 'object' ? Object.keys(response.data) : 'no es un objeto') : 'no hay data'
    });
    
    // Si es un objeto y no un array, examinamos más a fondo
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      // Examinamos cada propiedad del response.data para buscar arrays o información relevante
      Object.keys(response.data).forEach(key => {
        const value = response.data[key];
        console.log(`Propiedad '${key}' en response.data:`, {
          tipo: typeof value,
          esArray: Array.isArray(value),
          longitud: Array.isArray(value) ? value.length : null,
          muestra: Array.isArray(value) && value.length > 0 ? value[0] : value
        });
      });
    }
    
    return response;
  } catch (error) {
    console.error(`Error al recuperar materiales de zona ${zoneId}:`, error);
    if (error.response) {
      console.error("Respuesta de error:", {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
};

export const assignMaterialsToZone = async (data) => {
  try {
    console.log("Enviando datos al servidor:", {
      id_zona: parseInt(data.zoneId),
      id_material: parseInt(data.materialId),
      cantidad_asignada: parseInt(data.quantity)
    });
    
    return await apiClient.post(`${API_ENDPOINTS.MATERIAL_ZONE}`, {
      id_zona: parseInt(data.zoneId),
      id_material: parseInt(data.materialId),
      cantidad_asignada: parseInt(data.quantity)
    }, { 
      headers: getAuthHeaders() 
    });
  } catch (error) {
    console.error("Error en la asignación de materiales:", error);
    if (error.response) {
      console.error("Respuesta del servidor:", error.response.data);
      console.error("Estado HTTP:", error.response.status);
    }
    throw error;
  }
};

export const useMaterialsFromZone = async (data) => {
  try {
    console.log("Enviando datos de uso de materiales:", data);
    
    return await apiClient.post(`${API_ENDPOINTS.MATERIAL_ZONE}/uso`, {
      id_zona: parseInt(data.zoneId),
      id_material: parseInt(data.materialId),
      cantidad_usada: parseInt(data.quantity),
      notas: data.notes || ""
    }, { 
      headers: getAuthHeaders() 
    });
  } catch (error) {
    console.error("Error en el uso de materiales:", error);
    if (error.response) {
      console.error("Respuesta del servidor:", error.response.data);
      console.error("Estado HTTP:", error.response.status);
    }
    throw error;
  }
};

// User location update
export const updateUserLocation = async ({ latitude, longitude }) => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('No se encontró el ID del usuario');
    }

    const data = {
      id: parseInt(userId),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };
    
    const response = await apiClient.put(`${API_ENDPOINTS.USERS}/location`, data, { 
      headers: getAuthHeaders()
    });
    
    return response;
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
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
      workersResponse,
      materialRequestsResponse
    ] = await Promise.all([
      fetchDashboardMetrics(),
      fetchProjectsProgress(),
      fetchAttendance(),
      fetchMaterials(),
      fetchRecentActivities(),
      fetchWorkers(),
      fetchMaterialRequests("pending") // Obtener solicitudes pendientes
    ]);

    return {
      metrics: metricsResponse.data,
      projects: projectsResponse.data,
      attendance: attendanceResponse.data,
      materials: materialsResponse.data,
      activities: activitiesResponse.data,
      workers: addLocationToWorkers(workersResponse.data),
      materialRequests: materialRequestsResponse.data // Agregar solicitudes de materiales
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
    // Si el trabajador ya tiene una ubicación real (latitud y longitud), usarla
    if (worker.latitud && worker.longitud) {
      return {
        ...worker,
        name: worker.username || worker.name || `Trabajador ${index + 1}`,
        location: {
          lat: parseFloat(worker.latitud),
          lng: parseFloat(worker.longitud)
        },
        // Marcar explícitamente que es una ubicación real
        locationIsSimulated: false
      };
    }
    
    // Si no hay ubicación real, devolver el trabajador sin el campo location
    return {
      ...worker,
      name: worker.username || worker.name || `Trabajador ${index + 1}`
    };
  });
};

export const registerCheckIn = async (data) => {
  try {
    const formData = new FormData();
    formData.append('userId', localStorage.getItem('userId')); // Obtener el userId del localStorage
    formData.append('lat', data.latitude);
    formData.append('lng', data.longitude);
    formData.append('zoneId', data.zoneId); // Campo adicional para la zona
    if (data.photo) {
      formData.append('photo', data.photo);
    }

    const response = await apiClient.post(API_ENDPOINTS.CHECK_IN, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error al registrar check-in:', error);
    throw error;
  }
};

export const fetchRecentCheckIns = async (limit = 5) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.CHECK_INS_RECENT}?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener check-ins recientes:', error);
    throw error;
  }
};

export default apiClient;
// Material Request operations
export const createMaterialRequest = async (data) => {
  try {
    // Asegurarse de que los datos numéricos sean números
    if (typeof data.user_id === 'string') {
      data.user_id = parseInt(data.user_id);
    }
    
    if (typeof data.zone_id === 'string') {
      data.zone_id = parseInt(data.zone_id);
    }
    
    if (typeof data.quantity_requested === 'string') {
      data.quantity_requested = parseFloat(data.quantity_requested);
    }
    
    // Datos en el formato correcto para el backend
    const requestData = {
      user_id: data.user_id,
      zone_id: data.zone_id,
      quantity_requested: data.quantity_requested,
      message: data.message || "",
      material: data.material || "",
      status: "pending"
    };
    
    console.log("Enviando solicitud de materiales:", requestData);
    
    return await apiClient.post(API_ENDPOINTS.MATERIAL_REQUESTS, requestData, { 
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

