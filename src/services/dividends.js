import axios from 'axios'

const dividendsApi = axios.create({baseURL: 'http://localhost:3000'})

async function getAllDividends() {
    try {
        const response = await dividendsApi.get('/auth/getAllDividends')
        return response.data
    } catch (error) {
        console.error('Error fetching dividends:', error)
        throw error
    }
}

export { getAllDividends }