import { getAllDividends } from "../../services/dividends"
import { getStocksList, stockData } from "../../services/stocks";

let filteredDividends = [];
let dividends = [];
let stocks = [];
let updated = [];

        const fetchDividendsStocks = async () => {
            try {
                stocks = await getStocksList();
                updated = await Promise.all(
                    stocks.map(async (stock) => {
                        const stockDataResult = await stockData(stock.symbol);
                        return {
                            ...stock,
                            currentPrice: stockDataResult["stock info: "].currentPrice,
                        };
                    })
                )

                const allDividends = await getAllDividends()
                if (allDividends && allDividends.unfilteredDividends) {

                const includedDividends = [
                    "NOTA",
                    "RENDIMENTO RENDA FIXA",
                    "CARTAO DE CREDITO",
                    "CASHBACK CARTAO",
                ];
                

                filteredDividends = allDividends.unfilteredDividends.filter(
                    dividend => includedDividends.includes(dividend.ticker)
                )
                
                dividends = allDividends
            }
                else {
                    console.warn('No dividends available');
                    filteredDividends = []
                    dividends = []                    
                }
            } catch (error) {
                console.error('Error fetching Data:', error);
            }
        }

export { fetchDividendsStocks, filteredDividends, dividends, stocks, updated }