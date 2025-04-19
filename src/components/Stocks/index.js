import './Stocks.css';
import { useState, useEffect } from 'react';
import { searchStocks, stockData, addStock, getStocksList, updateStock } from '../../services/stocks';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';
import { ReactComponent as AddIcon } from '../../assets/icons/add-icon.svg'
import { ReactComponent as SearchIcon } from '../../assets/icons/search-icon.svg'

const Stocks = () => {
    const [stock, setStock] = useState('');
    const [results, setResults] = useState([]);
    const [stockClicked, setStockClicked] = useState([]);
    const [showingStock, setShowingStock] = useState(false);
    const [stocksList, setStocksList] = useState([]);
    const [stockAdded, setStockAdded] = useState(false)
    const [updatedStocksList, setUpdatedStocksList] = useState([])
    const [selectedStock, setSelectedStock] = useState(null)
    const [newAveragePrice, setNewAveragePrice] = useState('')
    const [searchStock, setSearchStock] = useState(false)

    useEffect(() => {
        const fetchStocksList = async () => {
            try {
                const stocks = await getStocksList()
                setStocksList(stocks)
            } catch (error) {
                console.error('Error fetching stocks list:', error);
            }
        }
        fetchStocksList()
    }
        , [stockAdded])

    useEffect(() => {
        const fetchStocksList = async () => {
            try {
                const updated = await Promise.all(
                    stocksList.map(async (stock) => {
                        const stockDataResult = await stockData(stock.symbol)
                        return {
                            ...stock,
                            currentPrice: stockDataResult["stock info: "].currentPrice
                        }
                    }))
                setUpdatedStocksList(updated)
                console.log('updatedStocksList', updatedStocksList);

            } catch (error) {
                console.error('Error fetching stocks list:', error);
            }
        }
        fetchStocksList()
        // const interval = setInterval(fetchStocksList, 5000)

        // return () => clearInterval(interval)
    }, [stocksList])

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
            setStockAdded((prevState) => !prevState)
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
    };

    const handleUpdateAveragePrice = async () => {
        if (selectedStock) {
            try {
                const updatedStocks = updatedStocksList.map((stock) =>
                stock.symbol === selectedStock.symbol
                    ? { ...stock, averagePrice: parseFloat(newAveragePrice) }
                    : stock
            );
            setUpdatedStocksList(updatedStocks); // Atualiza a lista com o novo averagePrice
            setStocksList(updatedStocks); // Atualiza a lista de ações

            await updateStock({
                _id: selectedStock._id,
                averagePrice: parseFloat(newAveragePrice)
            })

            setSelectedStock(null); // Reseta o estado da ação selecionada
            setNewAveragePrice(''); // Reseta o campo de edição
            alert('Average price updated successfully!')
            }
            catch (error) {
                console.error('Error updating stock:', error);
            }
            
        }
    }

    return (
        <div className="stocks-container">
            <h1 className="stocks-container-title">Dashboard</h1>
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
                    <button onClick={handleUpdateAveragePrice}>Update Average Price</button>
                    <button onClick={() => setSelectedStock(null)}>Cancel</button>
                </div>
                :
                <div>
                    {searchStock ?
                        <div className="search-container">
                            <CloseIcon className='close-search-icon' onClick={() => setSearchStock(false)}></CloseIcon>
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
                                <CloseIcon className='stock-data-closeIcon' onClick={() => setShowingStock(false)}></CloseIcon>
                                <AddIcon className='stock-data-addIcon' onClick={handleAddStock}></AddIcon>
                                <h2 className='stock-data-symbol'>{stockClicked.symbol}</h2>
                                <p className='stock-data-price'>{stockClicked.currency === 'BRL' ? 'R$' : stockClicked.currency === 'USD' ? '$' : ''}
                                    {stockClicked.currentPrice}
                                </p>
                            </div> : null}
                    </div>
                    <div className='stocks-list-container'>
                        {updatedStocksList.length > 0 ?
                            <ul className='stocks-list'>
                                {updatedStocksList.map((stock, index) => {
                                    const priceDifference = stock.currentPrice - stock.averagePrice; // Diferença absoluta
                                    const percentageDifference = ((priceDifference / stock.averagePrice) * 100).toFixed(2); // Diferença em %
                                    const isPositive = priceDifference >= 0; // Verifica se é valorização ou desvalorização
                                    return (
                                        <li key={index} onClick={() => handleStockClick(stock)}>
                                            <p>{stock.symbol.replace('.SA', '')}</p>
                                            <div>
                                                <p className='stock-price'>
                                                    {stock.currency === 'BRL' ? 'R$' : stock.currency === 'USD' ? '$' : ''}
                                                    {stock.currentPrice.toFixed(0)}
                                                </p>
                                                <span style={{ color: isPositive ? 'green' : 'red' }}>
                                                    {Math.round(percentageDifference)}%
                                                </span>
                                            </div>


                                        </li>
                                    );
                                })}
                            </ul>
                            : null}
                    </div>
                </div>
            }



        </div>
    );
};

export default Stocks