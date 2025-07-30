import axios from "axios"
import { BASE_URL } from "./apiConfig"

const creditCardsApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

async function getAllCreditCards(id) {
    try {
        const response = await creditCardsApi.get(`/auth/getAllCreditCards/${id}`)        
        
        return response.data
    } catch (error) {
        console.error('Error fetching credit cards:', error)
        throw error
    }
}

async function createCardTransaction(transaction) {
    try {
        const response = await creditCardsApi.post('/auth/createCardTransaction', transaction)
        
        return response.data
    } catch (error) {
        console.error('Error creating card transaction:', error)
        throw error
    }
    
}

async function deleteCardTransaction(id) {
    try {
        const response = await creditCardsApi.delete(`/auth/deleteCardTransaction/${id}`)
        return response.data
    } catch (error) {
        console.error('Error deleting card transaction:', error)
        throw error
    }
}

export {
    getAllCreditCards,
    createCardTransaction,
    deleteCardTransaction
}