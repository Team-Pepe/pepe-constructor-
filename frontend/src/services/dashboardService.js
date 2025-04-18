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

export const updateMaterial = (id, formData) => 
  apiClient.put(`${API_ENDPOINTS.MATERIALS}/${id}`, formData, { 
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json'
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
  
  const fixedLocations = [
    { lat: 4.8133, lng: -75.6961 },
    { lat: 4.8182, lng: -75.6923 },
    { lat: 4.8056, lng: -75.7056 },
    { lat: 4.8240, lng: -75.6845 },
    { lat: 4.8050, lng: -75.6845 },
    { lat: 4.8150, lng: -75.7100 }
  ];
  
  return workers.map((worker, index) => ({
    ...worker,
    name: worker.username || worker.name || `Trabajador ${index + 1}`,
    location: fixedLocations[index % fixedLocations.length]
  }));
};

export default apiClient;
