import axios from "axios"

// const loginApi = axios.create({ 
//     baseURL: 'http://localhost:3000/',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     withCredentials: true
// })
const loginApi = axios.create({baseURL: 'https://api-yield.vercel.app/',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

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

async function getCurrenteUser() {
    try {
        const response = await loginApi.get('/auth/me')
        console.log('Current user data:', response.data);
        
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
    getCurrenteUser
}