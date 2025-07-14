import axios from "axios"

// const stocksApi = axios.create({ baseURL: 'http://localhost:3000/',
//     withCredentials: true
//  })

const stocksApi = axios.create({ baseURL: 'https://api-yield-production.up.railway.app/',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
 })


async function searchStocks(search) {
    try {
        const response = await stocksApi.post('/auth/searchStocks', { "stock": search })
        if (response.data && response.data.aviso) {
            return { aviso: response.data.aviso };
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching stocks:', error);
        throw error;
    }
}


async function stockData(stock) {
    try {
        const response = await stocksApi.post('/auth/getStockData', { "stock": stock })
        if (response.data && response.data.aviso) {
            return { aviso: response.data.aviso };
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching stock data:', error);
        throw error;
    }
}


async function addStock(stock) {
    console.log('Adding stock:', stock);
    try {
        const response = await stocksApi.post('/auth/addStock', stock);
        if (response.data && response.data.aviso) {
            return { aviso: response.data.aviso };
        }
        return response.data;
    } catch (error) {
        console.error('Error adding stock:', error);
        throw error;
    }
}


async function getStocksList(id) {
    try {
        const response = await stocksApi.get(`/auth/getStocksList/${id}`);
        if (response.data && response.data.aviso) {
            return { aviso: response.data.aviso };
        }
        return response.data;
    } catch (error) {
        console.error('Error listing stocks:', error);
        throw error;
    }
}


async function updateStock(stock) {
    try {
        const response = await stocksApi.put(`/auth/updateStock/${stock._id}`, {
            averagePrice: stock.averagePrice,
            stocksQuantity: stock.stocksQuantity
        });
        if (response.data && response.data.aviso) {
            return { aviso: response.data.aviso };
        }
        return response.data;
    } catch (error) {
        console.error('Error updating stock:', error);
        throw error;
    }
}


async function deleteStock(stockId) {
    try {
        const response = await stocksApi.delete(`/auth/deleteStock/${stockId}`);
        if (response.data && response.data.aviso) {
            return { aviso: response.data.aviso };
        }
        return response.data;
    } catch (error) {
        console.error('Error deleting stock:', error);
        throw error;
    }
}

export { searchStocks,
            stockData,
            addStock,
            getStocksList,
            updateStock,
            deleteStock
        }