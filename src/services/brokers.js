import axios from "axios"

//const brokersApi = axios.create({ baseURL: 'http://localhost:3000/' })
const brokersApi = axios.create({baseURL: 'https://api-yield.vercel.app/',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: false
})

async function getBrokers() {
    try {
        const response = await brokersApi.get('/auth/getBrokers')
        return response.data
    } catch (error) {
        console.error('Error fetching brokers:', error)
        throw error
    }
}

async function addBroker(broker) {
    try {
        console.log('Adding broker:', broker);
        
        const response = await brokersApi.post('/auth/createBroker', { 
            brokerName: broker.brokerName,
            currency: broker.currency
         })
        return response.data
    } catch (error) {
        console.error('Error adding broker:', error)
        throw error
    }
}

export { getBrokers,
         addBroker }