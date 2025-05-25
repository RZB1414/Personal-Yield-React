import './Stocks.css';
import { useState, useEffect } from 'react';
import { searchStocks, stockData, addStock, updateStock, deleteStock } from '../../services/stocks';
import { stocks, updated, dividends } from '../Connect';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';
import { ReactComponent as AddIcon } from '../../assets/icons/add-circle-icon.svg'
import { ReactComponent as SearchIcon } from '../../assets/icons/search-icon.svg'
import { ReactComponent as DeleteIcon } from '../../assets/icons/delete-icon.svg'

const Stocks = ({ fetchingAgain, setRefresh }) => {

    const [stock, setStock] = useState('');
    const [results, setResults] = useState([]);
    const [stockClicked, setStockClicked] = useState([]);
    const [showingStock, setShowingStock] = useState(false);
    const [stocksList, setStocksList] = useState([]);
    const [updatedStocksList, setUpdatedStocksList] = useState([])
    const [selectedStock, setSelectedStock] = useState(null)
    const [newAveragePrice, setNewAveragePrice] = useState('')
    const [stocksQuantity, setStocksQuantity] = useState(0)
    const [searchStock, setSearchStock] = useState(false)
    const [dividendsList, setDividendsList] = useState([])
    const [updatingValues, setUpdatingValues] = useState('')

    useEffect(() => {
        setStocksList(stocks)
        setUpdatedStocksList(updated)
        const dividendsList = dividends.dividends;
        const grouped = groupDividendsByTicker(dividendsList)
        setDividendsList(grouped)

    }, [fetchingAgain])

    // Função para agrupar dividendos por ticker e somar os valores
    const groupDividendsByTicker = (dividends) => {
        return dividends.reduce((acc, dividend) => {
            let ticker = dividend.ticker.replace('.SA', '');
            // Se não termina com número, adiciona '3'
            if (!/\d$/.test(ticker)) {
                ticker = ticker + '3';
            }
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
            setRefresh(prevRefresh => prevRefresh + 1)
            alert(response.msg)
            setShowingStock(false)
            setStock('')
            setResults([])
            setSearchStock(false)

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

    const handleDeleteStock = async (id) => {
        if (window.confirm('Are you sure you want to delete this stock?')) {
            try {
                await deleteStock(id)
                setUpdatedStocksList((prevStocks) => prevStocks.filter(stock => stock._id !== id))
                setSelectedStock(null)
                setShowingStock(false)
                setStock('')
                setResults([])
            } catch (error) {
                console.error('Error deleting stock:', error);
            }
        }
    }

    // Calcula o preço médio geral

    const totalInvested = updatedStocksList.reduce((acc, stock) => acc + (stock.averagePrice * stock.stocksQuantity), 0);

    // Calcula o preço médio geral considerando dividendos        
    const totalCurrentValue = updatedStocksList.reduce(
        (acc, stock) => acc + (stock.currentPrice * stock.stocksQuantity), 0
    );

    const percentualValorizacao = totalInvested > 0
        ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
        : 0;



    const uniqueTickers = [...new Set(updatedStocksList.map(stock => {
        let ticker = stock.symbol.replace('.SA', '');
        if (!/\d$/.test(ticker)) ticker = ticker + '3';
        return ticker;
    }))];

    const totalDividends = uniqueTickers.reduce((acc, ticker) => {
        return acc + (dividendsList[ticker] || 0);
    }, 0);

    const totalReturnPercent = totalInvested > 0
        ? (((totalCurrentValue + totalDividends - totalInvested) / totalInvested) * 100)
        : 0;

    return (
        <>
            <h1 className="stocks-container-title">Dashboard</h1>

            {selectedStock ?
                <div className="stock-edit">
                    <CloseIcon className='close-search-icon' onClick={() => setSelectedStock(null)} />
                    <DeleteIcon className='delete-icon' onClick={() => handleDeleteStock(selectedStock._id)} />

                    <h2>{selectedStock.symbol.replace('.SA', '')}</h2>
                    <p>Current Average Price: {selectedStock.averagePrice}</p>
                    <input
                        className='average-price-input'
                        type="number"
                        value={newAveragePrice}
                        onChange={(e) => setNewAveragePrice(e.target.value)}
                        placeholder="Enter new average price"
                    />

                    <p>Stock quantity: {selectedStock.stocksQuantity}</p>
                    <input
                        className='stock-quantity-input'
                        type="number"
                        onChange={(e) => setStocksQuantity(e.target.value)}
                        placeholder="Stock quantity"
                    />
                    <button className='update-values-button' onClick={handleUpdateStockValues}>Update values</button>
                    <button className='update-values-button' onClick={() => setSelectedStock(null)}>Cancel</button>
                    {updatingValues === '' ? null : <p className='updating-values'>{updatingValues}</p>}
                </div>

                :
                <div className="stocks-container-all">
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
                                <CloseIcon className='close-search-icon' onClick={() => {
                                    setSearchStock(false)
                                    setShowingStock(false)
                                    setResults([])
                                    setStock('')
                                }}></CloseIcon>
                            </div> :
                            <SearchIcon className='search-icon' onClick={() => {
                                setSearchStock(true)
                                setStock('')
                                setResults([])
                            }}></SearchIcon>
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

                                            // const dividends = dividendsList[stock.symbol.replace('.SA', '').replace(/[34]/g, '')] || 0;
                                            const dividends = dividendsList[stock.symbol.replace('.SA', '')] || 0
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
                                                        {Number(percentageDifference).toFixed(2)}%
                                                    </td>
                                                    <td style={{ color: isPositiveWithDividends ? 'green' : 'red' }}>
                                                        {dividends > 0 ? `${Number(totalPercentageDifference).toFixed(2)}%` : 0}
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

                                        {/* Adiciona a última linha com os totais */}
                                        <tr>
                                            <td className="sticky-column"><strong>Total</strong></td>
                                            <td></td>
                                            <td></td>
                                            <td>
                                                <strong>
                                                    {percentualValorizacao.toFixed(2)}%
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {totalReturnPercent.toFixed(2)}%
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    R${updatedStocksList.reduce((acc, stock) => acc + (stock.currentPrice * stock.stocksQuantity), 0).toFixed(2)}
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    R${updatedStocksList.reduce((acc, stock) => {
                                                        // const dividends = dividendsList[stock.symbol.replace('.SA', '').replace(/[34]/g, '')] || 0;
                                                        const dividends = dividendsList[stock.symbol.replace('.SA', '')] || 0
                                                        return acc + dividends;
                                                    }, 0).toFixed(2)}
                                                </strong>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </div>
                    <h2 className='footer'>Yield Management</h2>
                </div>
            }
        </>
    )
}

export default Stocks