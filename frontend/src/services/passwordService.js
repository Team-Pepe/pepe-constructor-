import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    // Mejorar el manejo de errores
    if (error.response?.status === 429) {
      throw {
        message: "Por favor espera 5 minutos antes de solicitar otro correo",
        isRateLimit: true
      };
    }
    throw error.response?.data || { message: "Error al solicitar recuperación" };
  }
};