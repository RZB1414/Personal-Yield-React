import axios from "axios"
import { BASE_URL } from "./apiConfig"

const brokersApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

async function getBrokers(id) {
    try {
        const response = await brokersApi.get(`/auth/getBrokers/${id}`)
        return response.data
    } catch (error) {
        console.error('Error fetching brokers:', error)
        throw error
    }
}

async function addBroker(broker) {
    try {
        const response = await brokersApi.post('/auth/createBroker', broker)
        return response.data
    } catch (error) {
        console.error('Error adding broker:', error)
        throw error
    }
}

export { getBrokers,
         addBroker }