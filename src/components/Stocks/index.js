import './Stocks.css';
import { useState, useEffect } from 'react';
import { searchStocks, stockData, addStock, getStocksList, updateStock } from '../../services/stocks';
import { getAllDividends } from '../../services/dividends';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';
import { ReactComponent as AddIcon } from '../../assets/icons/add-icon.svg'
import { ReactComponent as SearchIcon } from '../../assets/icons/search-icon.svg'

const Stocks = () => {

    const [stock, setStock] = useState('');
    const [results, setResults] = useState([]);
    const [stockClicked, setStockClicked] = useState([]);
    const [showingStock, setShowingStock] = useState(false);
    const [stocksList, setStocksList] = useState([]);
    const [stockAdded, setStockAdded] = useState(0)
    const [updatedStocksList, setUpdatedStocksList] = useState([])
    const [selectedStock, setSelectedStock] = useState(null)
    const [newAveragePrice, setNewAveragePrice] = useState('')
    const [stocksQuantity, setStocksQuantity] = useState(0)
    const [searchStock, setSearchStock] = useState(false)
    const [loading, setLoading] = useState('Loading data...')
    const [dividendsList, setDividendsList] = useState([])
    const [updatingValues, setUpdatingValues] = useState('')

        useEffect(() => {
        const fetchStocksAndUpdate = async () => {
            try {
                // Atualiza a lista de ações
                const stocks = await getStocksList();
                setStocksList(stocks);
    
                // Atualiza os preços das ações
                const updated = await Promise.all(
                    stocks.map(async (stock) => {
                        const stockDataResult = await stockData(stock.symbol);
                        return {
                            ...stock,
                            currentPrice: stockDataResult["stock info: "].currentPrice,
                        };
                    })
                );
                setUpdatedStocksList(updated);
            } catch (error) {
                console.error('Error fetching stocks or updating prices:', error);
            } finally {
                setLoading('');
            }
        };
    
        fetchStocksAndUpdate();
    }, [stockAdded]); // Depende apenas de `stockAdded`

        useEffect(() => {
        const fetchDividends = async () => {
            try {
                const dividends = await getAllDividends();
                const dividendsList = dividends.dividends;
    
                // Agrupa os dividendos por ticker e soma os valores
                const grouped = groupDividendsByTicker(dividendsList);
                setDividendsList(grouped);
                console.log('Dividends List:', grouped);
            } catch (error) {
                console.error('Error fetching dividends:', error);
            }
        };
    
        fetchDividends();
    }, [stockAdded]); // Executa apenas uma vez

    // Função para agrupar dividendos por ticker e somar os valores
    const groupDividendsByTicker = (dividends) => {
        return dividends.reduce((acc, dividend) => {
            // Remove números do ticker usando expressão regular
            const ticker = dividend.ticker.replace(/(?<!\d)11(?!\d)|\d+/g, match => match === '11' ? '11' : '')
            const { valor } = dividend;
            if (!acc[ticker]) {
                acc[ticker] = 0;
            }
            acc[ticker] += valor;
            return acc;
        }, {});
    };

    const handleSearch = async () => {
        try {
            const searchResults = await searchStocks(stock)
            setResults(searchResults)
            console.log(searchResults)

        } catch (error) {
            console.error('Error searching for stocks:', error);
        }
    }

    const stockInfo = async (stock) => {
        try {
            const stockDataResult = await stockData(stock)
            const stockDetails = stockDataResult["stock info: "]
            setStockClicked(stockDetails)
            setShowingStock(true)
        } catch (error) {
            console.error('Error fetching stock data:', error);
        }
    }

    const handleAddStock = async () => {
        try {
            const stockToAdd = {
                symbol: stockClicked.symbol,
                currency: stockClicked.currency,
                averagePrice: 0
            }
            if (stocksList.some(stock => stock.symbol === stockToAdd.symbol)) {
                alert('Stock already exists in the list!')
                setShowingStock(false)
                setStock('')
                setResults([])
                return
            }
            const response = await addStock(stockToAdd)
            setStockAdded((prevState) => prevState + 1) // Atualiza o estado para forçar a atualização da lista de ações
            setShowingStock(false)
            setStock('')
            setResults([])
            console.log(response)
        } catch (error) {
            console.error('Error adding stock:', error);
        }
    }

    const handleStockClick = (stock) => {
        setSelectedStock(stock); // Define a ação selecionada
        setNewAveragePrice(stock.averagePrice); // Preenche o campo com o averagePrice atual
        setStocksQuantity(stock.stocksQuantity); // Preenche o campo com a quantidade atual de ações	
    };

    const handleUpdateStockValues = async () => {
        if (selectedStock) {
            setUpdatingValues('Updating values...')
            try {
                const updatedStocks = updatedStocksList.map((stock) =>
                    stock.symbol === selectedStock.symbol
                        ? {
                            ...stock,
                            averagePrice: parseFloat(newAveragePrice),
                            stocksQuantity: parseInt(stocksQuantity)
                        }
                        : stock
                );
                setUpdatedStocksList(updatedStocks); // Atualiza a lista com o novo averagePrice
                setStocksList(updatedStocks); // Atualiza a lista de ações

                await updateStock({
                    _id: selectedStock._id,
                    averagePrice: parseFloat(newAveragePrice),
                    stocksQuantity: parseInt(stocksQuantity)
                })

                setSelectedStock(null); // Reseta o estado da ação selecionada
                setNewAveragePrice(''); // Reseta o campo de edição
                setStocksQuantity('');
                setUpdatingValues('')
                setShowingStock(false)
            }
            catch (error) {
                console.error('Error updating stock:', error);
            }

        }
    }

    const handleCloseIconResultsContainer = () => {
        setShowingStock(false)
        setStock('')
        setResults([])
    }

    return (
        <>
            <h1 className="stocks-container-title">Dashboard</h1>
            {loading === 'Loading data...' ? <p className='loading'>{loading}</p> : null}

            {selectedStock ?
                <div className="stock-edit">
                    <CloseIcon className='close-search-icon' onClick={() => setSelectedStock(null)}></CloseIcon>
                    <h2>{selectedStock.symbol.replace('.SA', '')}</h2>
                    <p>Current Average Price: {selectedStock.averagePrice}</p>
                    <input
                        type="number"
                        value={newAveragePrice}
                        onChange={(e) => setNewAveragePrice(e.target.value)}
                        placeholder="Enter new average price"
                    />

                    <p>Stock quantity: {selectedStock.stocksQuantity}</p>
                    <input
                        type="number"
                        onChange={(e) => setStocksQuantity(e.target.value)}
                        placeholder="Enter new stock quantity"
                    />
                    <button onClick={handleUpdateStockValues}>Update values</button>
                    <button onClick={() => setSelectedStock(null)}>Cancel</button>
                    {updatingValues === '' ? null : <p className='updating-values'>{updatingValues}</p>}
                </div>

                :
                <div>
                    <div className='stocks-list-wrapper'>
                        {searchStock ?
                            <div className="search-container">
                                <input
                                    className='search-input'
                                    type="text"
                                    placeholder="Enter stock name..."
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch()
                                        }
                                    }}
                                />
                                <button className='search-input-button' onClick={handleSearch}>Search</button>
                                <CloseIcon className='close-search-icon' onClick={() => setSearchStock(false)}></CloseIcon>
                            </div> :
                            <SearchIcon className='search-icon' onClick={() => setSearchStock(true)}></SearchIcon>
                        }

                        <div className="results-container">
                            {showingStock ? null :
                                <ul>
                                    {results.map((result, index) => (
                                        <li onClick={() => stockInfo(result.symbol)} key={index}>
                                            {result.symbol} - {result.shortname} ({result.exchDisp})
                                        </li>
                                    ))}
                                </ul>}
                            {showingStock ?
                                <div className="stock-data">
                                    <div className='stock-data-symbol-price'>
                                        <h2 className='stock-data-symbol'>{stockClicked.symbol.replace('.SA', '')}</h2>
                                        <h3 className='stock-data-price'>{stockClicked.currency === 'BRL' ? 'R$' : stockClicked.currency === 'USD' ? '$' : ''}
                                            {stockClicked.currentPrice}
                                        </h3>
                                    </div>

                                    <div className='stock-data-close-addIcon'>
                                        <CloseIcon className='stock-data-closeIcon' onClick={handleCloseIconResultsContainer}></CloseIcon>
                                        <AddIcon className='stock-data-addIcon' onClick={handleAddStock}></AddIcon>
                                    </div>
                                </div> : null}
                        </div>

                    </div>

                    <div className='stocks-list-container'>
                        {updatedStocksList.length > 0 ? (
                            <div className="table-wrapper">
                                <table className='stocks-table'>
                                    <thead>
                                        <tr>
                                            <th className="sticky-column">Symbol</th>
                                            <th>Current Price</th>
                                            <th>Avg Price</th>
                                            <th>Stock Return</th>
                                            <th>Return & Div</th>
                                            <th>Total Value</th>
                                            <th>Dividends</th>
                                            <th>Stock Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {updatedStocksList.map((stock, index) => {
                                            const priceDifference = stock.currentPrice - stock.averagePrice;
                                            const percentageDifference = ((priceDifference / stock.averagePrice) * 100).toFixed(2);
                                            const isPositive = priceDifference >= 0;

                                            const dividends = dividendsList[stock.symbol.replace('.SA', '').replace(/[34]/g, '')] || 0;
                                            const totalPercentageDifference = (
                                                (((stock.currentPrice * stock.stocksQuantity + dividends) - (stock.averagePrice * stock.stocksQuantity)) /
                                                    (stock.averagePrice * stock.stocksQuantity)) * 100
                                            ).toFixed(2);
                                            const isPositiveWithDividends = totalPercentageDifference >= 0;

                                            const totalValue = stock.currentPrice * stock.stocksQuantity;

                                            return (
                                                <tr key={index}>
                                                    <td className="sticky-column" onClick={() => handleStockClick(stock)}>{stock.symbol.replace('.SA', '')}</td>
                                                    <td>
                                                        {stock.currency === 'BRL' ? 'R$' : stock.currency === 'USD' ? '$' : ''}
                                                        {stock.currentPrice.toFixed(2)}
                                                    </td>
                                                    <td>{stock.averagePrice.toFixed(2)}</td>
                                                    <td style={{ color: isPositive ? 'green' : 'red' }}>
                                                        {Math.round(percentageDifference)}%
                                                    </td>
                                                    <td style={{ color: isPositiveWithDividends ? 'green' : 'red' }}>
                                                        {dividends > 0 ? `${Math.round(totalPercentageDifference)}%` : 0}
                                                    </td>
                                                    <td>
                                                        {stock.currency === 'BRL' ? 'R$' : stock.currency === 'USD' ? '$' : ''}
                                                        {totalValue.toFixed(2)}
                                                    </td>
                                                    <td>
                                                        {stock.currency === 'BRL' ? 'R$' : stock.currency === 'USD' ? '$' : ''}
                                                        {dividends.toFixed(2)}
                                                    </td>
                                                    <td>{stock.stocksQuantity}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </div>
                </div>

            }
        </>
    )
}

export default Stocks