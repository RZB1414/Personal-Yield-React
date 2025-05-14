import axios from "axios"

const totalValuesApi = axios.create({ baseURL: 'http://localhost:3000/' })
// const totalValuesApi = axios.create({baseURL: 'https://api-yield.vercel.app/',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     withCredentials: false
// })

async function getAllTotalValues() {
    try {
        const response = await totalValuesApi.get('/auth/getAllTotalValueBrokers')
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

async function updateTotalValue(totalValue) {
    try {
        const response = await totalValuesApi.put(`/auth/updateTotalValueBroker/`, totalValue)
        console.log(totalValue);
        
        return response.data
    } catch (error) {
        console.error('Error updating total value:', error)
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
         updateTotalValue,
         deleteTotalValue
        }