import axios from "axios"
import { BASE_URL } from "./apiConfig"

const loginApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

// Interceptor para renovar o accessToken automaticamente
loginApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Se for 401 e não for a própria rota de refresh, tenta renovar
        if (error.response && error.response.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refreshToken')) {
            originalRequest._retry = true;
            try {
                await refreshAccessToken();
                return loginApi(originalRequest);
            } catch (refreshError) {
                // Se falhar ao renovar, faz logout (pode limpar sessionStorage/localStorage se desejar)
                window.sessionStorage.clear();
                // Redireciona para a tela de login
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

async function createUser(form) {
    try {
        const response = await loginApi.post('/auth/createUser', form)
        console.log('User created successfully:', response.data)

        return response.data
    } catch (error) {
        console.error('Error creating user:', error)
        throw error
    }
}

async function loginUser(form) {
    try {
        const response = await loginApi.post('/auth/login', form)
        console.log('Login successful:', response.data)
        return response.data
    } catch (error) {
        console.error('Error logging in:', error)
        throw error
    }
}

async function refreshAccessToken() {
    try {
        const response = await loginApi.post('/auth/refreshToken')
        return response.data
    } catch (error) {
        console.error('Erro ao renovar token:', error)
        throw error
    }
}


async function getCurrentUser() {
    try {
        const response = await loginApi.get('/auth/me')        
        return response.data
    } catch (error) {
        console.error('Erro ao obter usuário atual:', error)
        throw error
    }
}

export {
    createUser,
    loginUser,
    refreshAccessToken,
    getCurrentUser
}