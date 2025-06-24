import axios from "axios"

//const encryptedDividendsApi = axios.create({ baseURL: 'http://localhost:3000/' })
const encryptedDividendsApi = axios.create({baseURL: 'https://api-yield.vercel.app/',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

async function saveData({records}) {
    try {        
        const response = await encryptedDividendsApi.post('/auth/save', {records})

        if (response && response.data) {
            console.log('resposta saveData:', response.data);
        }
        return response.data;
    } catch (error) {
        console.log('Error saving data:', error)
        return error.message
    }
}

async function getAllEncryptedDividends(id) {
    try {
        const response = await encryptedDividendsApi.get(`/auth/getDividendsById/${id}`)
        if (response) {
            return response;
        } else {
            console.warn('No data received from the backend');
            return [];
        }
    } catch (error) {
        console.error('Error fetching dividends:', error)
        return error.message
    }    
}

export {
    getAllEncryptedDividends,
    saveData
}