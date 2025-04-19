import axios from "axios"

const stocksApi = axios.create({ baseURL: 'http://localhost:3000/' })
//const stocksApi = axios.create({ baseURL: 'https://api-yield.vercel.app/' })

async function searchStocks(search) {
    try {
        const response = await stocksApi.post('/auth/searchStocks', { "stock": search })
        return response.data
    } catch (error) {
        console.error('Error fetching stocks:', error)
        throw error
    }
}

async function stockData(stock) {
    try {
        const response = await stocksApi.post('/auth/getStockData', { "stock": stock })
        return response.data
    } catch (error) {
        console.error('Error fetching stock data:', error)
        throw error
    }
}

async function addStock(stock) {
    console.log('Adding stock:', stock);
    
    try {
        const response = await stocksApi.post('/auth/addStock', { 
            currency: stock.currency,
            symbol: stock.symbol,
            averagePrice: stock.averagePrice
         })
        return response.data
    } catch (error) {
        console.error('Error adding stock:', error)
        throw error
    }
}

async function getStocksList() {
    try {
        const response = await stocksApi.get('/auth/getStocksList')
        return response.data
    } catch (error) {
        console.error('Error listing stocks:', error)
        throw error
    }
}

async function updateStock(stock) {

    try {
        const response = await stocksApi.put(`/auth/updateStock/${stock._id}`, { 
            averagePrice: stock.averagePrice
         })
        return response.data
    } catch (error) {
        console.error('Error updating stock:', error)
        throw error
    }
}

export { searchStocks,
            stockData,
            addStock,
            getStocksList,
            updateStock
        }