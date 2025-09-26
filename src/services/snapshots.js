import axios from 'axios';
import { BASE_URL } from './apiConfig';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Fetch snapshots with optional params
 * @param {Object} params
 * @param {string} [params.userId]
 * @param {string} [params.from] - YYYY-MM-DD
 * @param {string} [params.to] - YYYY-MM-DD
 * @param {boolean} [params.all]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 */
export async function getSnapshots(params = {}) {
  try {
    const response = await api.get('/auth/snapshots', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    throw error;
  }
}
