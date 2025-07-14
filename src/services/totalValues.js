import axios from "axios"

// const totalValuesApi = axios.create({ baseURL: 'http://localhost:3000/',
//     withCredentials: true
//  })

const totalValuesApi = axios.create({baseURL: 'https://api-yield-production.up.railway.app/',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

async function getAllTotalValues(id) {
    try {
        const response = await totalValuesApi.get(`/auth/getAllTotalValueBrokers/${id}`)
        return response.data
    } catch (error) {
        console.error('Error fetching total values:', error)
        throw error
    }
}

async function getTotalValueById(id) {
    try {
        const response = await totalValuesApi.get(`/auth/getTotalValueBroker/${id}`)
        return response.data
    } catch (error) {
        console.error('Error fetching total value by ID:', error)
        throw error
    }
}

async function addTotalValue(totalValue) {
    try {
        const response = await totalValuesApi.post('/auth/createTotalValueBroker', totalValue)
        return response.data
    } catch (error) {
        console.error('Error adding total value:', error)
        throw error
    }
}

async function deleteTotalValue(id) {
    try {
        const response = await totalValuesApi.delete(`/auth/deleteTotalValueBroker/${id}`)
        return response.data
    } catch (error) {
        console.error('Error deleting total value:', error)
        throw error
    }
}

export { getAllTotalValues,
         getTotalValueById,
         addTotalValue,
         deleteTotalValue
        }