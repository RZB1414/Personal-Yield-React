import axios from "axios"
import { BASE_URL } from "./apiConfig"

const loginApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

async function createUser(form) {
    try {
        const response = await loginApi.post('/auth/createUser', form)

        return response.data
    } catch (error) {
        console.error('Error creating user:', error)
        throw error
    }
}

async function loginUser(form) {
    try {
        const response = await loginApi.post('/auth/login', form)
        return response.data
    } catch (error) {
        console.error('Error logging in:', error)
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
    getCurrentUser
}