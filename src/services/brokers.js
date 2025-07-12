import axios from "axios"

// const brokersApi = axios.create({ baseURL: 'http://localhost:3000/',
//     withCredentials: true
//  })

const brokersApi = axios.create({baseURL: 'https://api-yield.vercel.app/',
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
        console.log('Adding broker:', broker);
        
        const response = await brokersApi.post('/auth/createBroker', broker)
        return response.data
    } catch (error) {
        console.error('Error adding broker:', error)
        throw error
    }
}

export { getBrokers,
         addBroker }