import axios from 'axios';
import { getAuthToken } from '@/utils/cookies';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

const API_ENDPOINTS = {
  BASE_URL: API_ENDPOINT,
  DASHBOARD_METRICS: '/api/dashboard/metrics',
  PROJECTS_PROGRESS: '/api/dashboard/projects-progress',
  ATTENDANCE: '/api/dashboard/attendance',
  CHECK_IN: '/api/check-in',
  CHECK_OUT: '/api/check-out',
  TODAYS_CHECKINS: '/api/getTodayCheckIn',
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

export const fetchWorkers = async () => {
  try {
    console.log("Solicitando lista de trabajadores...");
    const response = await apiClient.get(`${API_ENDPOINTS.USERS}?roleId=2`, { 
      headers: getAuthHeaders() 
    });
    
    console.log("Respuesta de API de trabajadores:", response);
    
    // Comprobar estructura de datos para depuración
    if (response.data) {
      console.log("Estructura de datos de trabajadores:", {
        tipo: typeof response.data,
        esArray: Array.isArray(response.data),
        longitud: Array.isArray(response.data) ? response.data.length : null
      });
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log("Ejemplo de un trabajador:", response.data[0]);
      }
    }
    
    return response;
  } catch (error) {
    console.error("Error al recuperar trabajadores:", error);
    if (error.response) {
      console.error("Respuesta de error:", {
        status: error.response.status,
        data: error.response.data
      });
    }
    // Devolver un objeto de respuesta vacío pero válido
    return { data: [] };
  }
};

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
    console.warn(data);
    
    
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
  // Objeto para almacenar las respuestas
  const responses = {
    metrics: null,
    projects: [],
    attendance: [],
    materials: [],
    activities: [],
    workers: [],
    materialRequests: []
  };

  try {
    console.log("Iniciando carga de datos del dashboard...");
    
    // Funciones para manejar cada API con gestión de errores independiente
    const fetchSafely = async (apiCall, dataKey) => {
      try {
        const response = await apiCall();
        console.log(`API ${dataKey} completada correctamente:`, response.status);
        return response.data;
      } catch (error) {
        console.error(`Error en API ${dataKey}:`, error);
        return null;
      }
    };

    // Realizar todas las llamadas en paralelo
    const results = await Promise.all([
      fetchSafely(fetchDashboardMetrics, 'metrics'),
      fetchSafely(fetchProjectsProgress, 'projects'),
      fetchSafely(fetchAttendance, 'attendance'),
      fetchSafely(fetchMaterials, 'materials'),
      fetchSafely(fetchRecentActivities, 'activities'),
      fetchSafely(fetchWorkers, 'workers'),
      fetchSafely(() => fetchMaterialRequests("pending"), 'materialRequests')
    ]);
    
    // Asignar resultados al objeto de respuestas
    [
      responses.metrics,
      responses.projects,
      responses.attendance,
      responses.materials,
      responses.activities,
      responses.workersRaw,
      responses.materialRequests
    ] = results;
    
    // Procesar específicamente los trabajadores con manejo adicional
    responses.workers = addLocationToWorkers(responses.workersRaw || []);
    
    console.log("Datos del dashboard cargados:", {
      metrics: responses.metrics ? "OK" : "Error",
      projects: Array.isArray(responses.projects) ? responses.projects.length : "Error",
      workers: Array.isArray(responses.workers) ? responses.workers.length : "Error",
      attendance: Array.isArray(responses.attendance) ? responses.attendance.length : "Error"
    });

    return responses;
  } catch (error) {
    console.error('Error general en fetchAllDashboardData:', error);
    // Devolver el objeto con los datos que hayamos podido obtener
    return responses;
  }
};

// Helper function to add location to workers
const addLocationToWorkers = (workers) => {
  // Verificar si workers es undefined, null, o no es un array
  if (!workers) {
    console.log("¡Advertencia! workers es undefined o null");
    return [];
  }
  
  if (!Array.isArray(workers)) {
    console.log("¡Advertencia! workers no es un array:", typeof workers);
    // Intentar convertir a array si es un objeto
    if (typeof workers === 'object') {
      // Verificar si hay una propiedad que contenga el array
      for (const key in workers) {
        if (Array.isArray(workers[key])) {
          console.log(`Encontrado array en la propiedad '${key}'`);
          workers = workers[key];
          break;
        }
      }
      
      // Si aún no es un array, intentar convertirlo
      if (!Array.isArray(workers)) {
        console.log("Intentando convertir objeto a array");
        try {
          workers = [workers];
        } catch (error) {
          console.error("Error al convertir a array:", error);
          return [];
        }
      }
    } else {
      console.error("No se puede procesar workers, tipo incompatible:", typeof workers);
      return [];
    }
  }
  
  console.log(`Procesando ${workers.length} trabajadores`);
  
  // Crear una copia segura de la lista de trabajadores
  return workers.map((worker, index) => {
    if (!worker) {
      console.log(`¡Advertencia! Trabajador en índice ${index} es null o undefined`);
      return { name: `Trabajador Desconocido ${index + 1}` };
    }
    
    // Mostrar trabajador para depuración
    console.log(`Trabajador ${index}:`, worker);
    
    // Buscar coordenadas en diferentes propiedades posibles
    const lat = parseFloat(
      worker.latitud || worker.latitude || worker.lat || 
      (worker.location ? worker.location.lat : null)
    );
    
    const lng = parseFloat(
      worker.longitud || worker.longitude || worker.lng || 
      (worker.location ? worker.location.lng : null)
    );
    
    // Verificar si encontramos coordenadas válidas
    const hasValidCoordinates = !isNaN(lat) && !isNaN(lng);
    console.log(`Trabajador ${worker.id || index}: coordenadas válidas: ${hasValidCoordinates}`, hasValidCoordinates ? {lat, lng} : "No tiene");
    
    // Si el trabajador tiene coordenadas válidas
    if (hasValidCoordinates) {
      return {
        ...worker,
        id: worker.id || `temp-${index}`,
        name: worker.username || worker.name || worker.nombre || `Trabajador ${index + 1}`,
        location: { lat, lng },
        locationIsSimulated: false
      };
    }
    
    // Si no hay ubicación real, devolver el trabajador sin el campo location
    return {
      ...worker,
      id: worker.id || `temp-${index}`,
      name: worker.username || worker.name || worker.nombre || `Trabajador ${index + 1}`
    };
  });
};

export const registerCheckIn = async (data) => {
  try {
    console.log('Datos de check-in recibidos:', data);
    const formData = new FormData();
    
    // Asegurarnos de que zoneId sea un número
    let zoneId = data.zoneId;
    if (typeof zoneId === 'object' && zoneId !== null) {
      zoneId = zoneId.id;
    }
    // Convertir a string después de asegurarnos que es un número
    formData.append('zoneId', String(parseInt(zoneId)));
    
    // Convertir coordenadas a strings después de asegurarnos que son números
    formData.append('latitude', String(parseFloat(data.latitude)));
    formData.append('longitude', String(parseFloat(data.longitude)));
    
    // Agregar el archivo de foto
    if (data.photo instanceof Blob) {
      formData.append('photo', data.photo, 'check-in-photo.jpg');
    } else {
      throw new Error('La foto es requerida y debe ser un archivo válido');
    }

    console.log('Enviando check-in al servidor con los siguientes datos:');
    for (let [key, value] of formData.entries()) {
      if (key !== 'photo') {
        console.log(`${key}: ${value} (${typeof value})`);
      } else {
        console.log('photo: [Archivo adjunto]');
      }
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
      headers: getAuthHeaders()
    });
    return {
      checkIns: response.data || [],
      success: true
    };
  } catch (error) {
    console.error('Error al obtener check-ins recientes:', error);
    // En caso de error, devolver array vacío pero no romper la aplicación
    return {
      checkIns: [],
      success: false,
      error: error.message
    };
  }
};

export const fetchUserById = async (userId) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.USERS}/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    // Retornar datos del localStorage como fallback
    return {
      id: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      name: localStorage.getItem('name'),
      bloodType: localStorage.getItem('bloodType'),
      email: localStorage.getItem('email'),
      roleId: Number(localStorage.getItem('roleId')),
      role: localStorage.getItem('role')
    };
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

// Assign material to zone
export const assignMaterialToZone = async (data) => {
  try {
    const response = await apiClient.post(`${API_ENDPOINTS.MATERIAL_ZONE}/assign`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error al asignar material a zona:', error);
    throw error;
  }
};

export const fetchTodaysCheckins = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.TODAYS_CHECKINS, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener checkins del día:', error);
    throw error;
  }
};

export const registerCheckOut = async (checkInId) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.CHECK_OUT, {
      checkInId: checkInId
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error al registrar check-out:', error);
    throw error;
  }
};

// Agregar esta función después de fetchUsers
export const updateUserData = async (userId, userData) => {
  try {
    console.log(`Actualizando usuario ${userId} con datos:`, userData);
    
    // Asegurarse de que los datos sean correctos antes de enviar
    const dataToSend = {
      ...userData,
      // Asegurarse de que roleId sea número
      roleId: Number(userData.roleId),
      // Asegurarse de que jobId sea número o null
      jobId: userData.jobId !== undefined && userData.jobId !== "" ? Number(userData.jobId) : null
    };
    
    // Si no es trabajador, jobId debe ser null
    if (dataToSend.roleId !== 2) {
      dataToSend.jobId = null;
    }
    
    console.log(`Datos finales para actualizar usuario ${userId}:`, dataToSend);
    
    const response = await apiClient.put(`${API_ENDPOINTS.USERS}/${userId}`, dataToSend, {
      headers: getAuthHeaders()
    });
    
    console.log(`Respuesta de actualización de usuario ${userId}:`, response);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar usuario ${userId}:`, error);
    if (error.response) {
      console.error("Respuesta del servidor:", error.response.data);
      console.error("Estado HTTP:", error.response.status);
    }
    throw error;
  }
};

