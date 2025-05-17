import axios from "axios"

const encryptedDividendsApi = axios.create({ baseURL: 'http://localhost:3000/' })

async function saveData(data) {
    try {
        await encryptedDividendsApi.post('/auth/save', data)
    } catch (error) {
        console.log('Error saving data:', error)
        return error.message
    }
}

async function getAllDividends(id) {
    try {
        await encryptedDividendsApi.get(`/auth/getDividendsById/:${id}`)
    } catch (error) {
        console.error('Error fetching dividends:', error)
        return error.message
    }    
}

export {
    getAllDividends,
    saveData
}