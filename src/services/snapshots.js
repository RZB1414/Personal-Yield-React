import axios from 'axios';
import { BASE_URL } from './apiConfig';

// Axios instance for snapshots API
const api = axios.create({
	baseURL: BASE_URL,
	headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token from sessionStorage if present
api.interceptors.request.use(
	(config) => {
		const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
		if (token) {
			config.headers['Authorization'] = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

/**
 * Fetch snapshots from backend
 * GET /auth/snapshots
 * @param {Object} params
 * @param {string} [params.userId]
 * @param {string} [params.from] - YYYY-MM-DD
 * @param {string} [params.to] - YYYY-MM-DD
 * @param {boolean} [params.all]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{page:number,limit:number,total:number,items:Array}>}
 */
export async function getSnapshots(params = {}) {
	try {
		const response = await api.get('/auth/snapshots', { params });
		return response.data;
	} catch (err) {
		console.error('Error fetching snapshots:', err);
		throw err;
	}
}

// Named export only
