// import axios from "axios"

// const brokersApi = axios.create({ baseURL: 'http://localhost:3000/' })

// async function getBrokers() {
//     try {
//         const response = await brokersApi.get('/auth/getBrokers')
//         return response.data
//     } catch (error) {
//         console.error('Error fetching brokers:', error)
//         throw error
//     }
// }

// async function addBroker(broker) {
//     try {
//         const response = await brokersApi.post('/auth/addBroker', { 
//             broker: broker.name,
//             currecy: broker.currency
//          })
//         return response.data
//     } catch (error) {
//         console.error('Error adding broker:', error)
//         throw error
//     }
// }

// export { getBrokers,
//          addBroker }