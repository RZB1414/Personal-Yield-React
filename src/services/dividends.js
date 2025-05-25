import axios from 'axios'

//const dividendsApi = axios.create({baseURL: 'http://localhost:3000'})
const dividendsApi = axios.create({baseURL: 'https://api-yield.vercel.app/',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: false
})

async function getAllDividends() {
    try {
        const unfilteredDividends = await dividendsApi.get('/auth/getAllDividends')
        if (!unfilteredDividends.data) {
            console.warn('No dividends available')
            return {unfilteredDividends: [], dividends: []}
        }
        const excludedDescriptions = [
            "NOTA",
            "TED RETIRADA",
            "TED RECEBIDO",
            "RENDIMENTO RENDA FIXA",
            "PIS E COFINS",
            "MULTA SALDO NEGATIVO",
            "CARTAO DE CREDITO",
            "CASHBACK CARTAO",
            "IOF CASHBACK CARTAO",
            "TRANSF ENVIADA CONTA DIGITAL",
            "TRANSF RECEBIDA CONTA DIGITAL",
            "NEOE26",
            "TAEE17",
            "VAMO34",
            "CTEE29"
        ]

        // Filtra os dividendos para excluir os indesejados
        const dividends = unfilteredDividends.data.filter(
            dividend => !excludedDescriptions.includes(dividend.ticker)
        )

        return {unfilteredDividends: unfilteredDividends.data, dividends}
    } catch (error) {
        console.error('Error fetching dividends:', error)
        return { unfilteredDividends: [], dividends: [] }
    }
}

async function createTransaction(transaction) {
    try {
        const response = await dividendsApi.post('/auth/createTransaction', transaction)
        return response.data
    } catch (error) {
        console.error('Error creating transaction:', error)
        throw error
    }
}

async function readFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {        
        const response = await dividendsApi.post('/auth/readFile', formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

export { getAllDividends,
         createTransaction,
         readFile
 }