import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Error al solicitar recuperación" };
  }
};