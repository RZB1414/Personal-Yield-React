import axios from 'axios'

//const dividendsApi = axios.create({baseURL: 'http://localhost:3000'})
const dividendsApi = axios.create({baseURL: 'https://api-yield.vercel.app/'})

async function getAllDividends() {
    try {
        const unfilteredDividends = await dividendsApi.get('/auth/getAllDividends')
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
        throw error
    }
}

export { getAllDividends }