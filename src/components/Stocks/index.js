import './Stocks.css';
import { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatPercent } from '../../utils/format';
import { searchStocks, stockData, addStock, updateStock, deleteStock } from '../../services/stocks';
import { stocks, updated, dividends } from '../Connect';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';
import { ReactComponent as AddIcon } from '../../assets/icons/add-circle-icon.svg'
import { ReactComponent as SearchIcon } from '../../assets/icons/search-icon.svg'
import { ReactComponent as DeleteIcon } from '../../assets/icons/delete-icon.svg'
import Snapshots from '../Snapshots';

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
    // Ref para o input de busca
    const searchInputRef = useRef(null);

    useEffect(() => {
        setStocksList(stocks)
        setUpdatedStocksList(updated)
        const dividendsList = Array.isArray(dividends.dividends) ? dividends.dividends : [];
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
            const userId = sessionStorage.getItem('userId')

            const stockToAdd = {
                symbol: stockClicked.symbol,
                currency: stockClicked.currency,
                averagePrice: 0,
                stocksQuantity: 0,
                userId: userId
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
                            stocksQuantity: parseFloat(stocksQuantity)
                        }
                        : stock
                );
                setUpdatedStocksList(updatedStocks); // Atualiza a lista com o novo averagePrice
                setStocksList(updatedStocks); // Atualiza a lista de ações

                await updateStock({
                    _id: selectedStock._id,
                    averagePrice: parseFloat(newAveragePrice),
                    stocksQuantity: parseFloat(stocksQuantity)
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
                setRefresh(prevRefresh => prevRefresh + 1)
            } catch (error) {
                console.error('Error deleting stock:', error);
            }
        }
    }

    // Calcula o preço médio geral

    const totalInvestedBRL = updatedStocksList
        .filter(stock => stock.currency === 'BRL')
        .reduce((acc, stock) => acc + (stock.averagePrice * stock.stocksQuantity), 0);

    // Calcula o preço médio geral considerando dividendos        
    const totalCurrentValueBRL = updatedStocksList
        .filter(stock => stock.currency === 'BRL')
        .reduce((acc, stock) => acc + (stock.currentPrice * stock.stocksQuantity), 0
        );

    const percentualValorizacaoBRL = totalInvestedBRL > 0
        ? ((totalCurrentValueBRL - totalInvestedBRL) / totalInvestedBRL) * 100
        : 0;

    // Calcula o preço médio geral das ações USD
    const totalInvestedUSD = updatedStocksList
        .filter(stock => stock.currency === 'USD')
        .reduce((acc, stock) => acc + (stock.averagePrice * stock.stocksQuantity), 0);
    const totalCurrentValueUSD = updatedStocksList
        .filter(stock => stock.currency === 'USD')
        .reduce((acc, stock) => acc + (stock.currentPrice * stock.stocksQuantity), 0);
    const percentualValorizacaoUSD = totalInvestedUSD > 0
        ? ((totalCurrentValueUSD - totalInvestedUSD) / totalInvestedUSD) * 100
        : 0;

    const uniqueTickers = [...new Set(updatedStocksList.map(stock => {
        let ticker = stock.symbol.replace('.SA', '');
        if (!/\d$/.test(ticker)) ticker = ticker + '3';
        return ticker;
    }))];

    const totalDividends = uniqueTickers.reduce((acc, ticker) => {
        return acc + (dividendsList[ticker] || 0);
    }, 0);

    const totalReturnPercent = totalInvestedBRL > 0
        ? (((totalCurrentValueBRL + totalDividends - totalInvestedBRL) / totalInvestedBRL) * 100)
        : 0;

    // Calcula valorização percentual total da carteira BRL no dia
    const brlStocks = updatedStocksList.filter(stock => stock.currency === 'BRL');
    const totalCurrentValue = brlStocks.reduce((acc, stock) => acc + (stock.currentPrice * stock.stocksQuantity), 0);
    const totalYesterdayValue = brlStocks.reduce((acc, stock) => {
        const yesterdayPrice = stock.currentPrice / (1 + (Number(stock.dayPriceChangePercent) || 0));
        return acc + (yesterdayPrice * stock.stocksQuantity);
    }, 0);

    const carteiraValorizacaoDia = totalYesterdayValue > 0
        ? ((totalCurrentValue - totalYesterdayValue) / totalYesterdayValue) * 100
        : 0;

    // Calcula valorização percentual total da carteira USD no dia
    const usdStocks = updatedStocksList.filter(stock => stock.currency === 'USD');
    const totalCurrentValueUSD_Day = usdStocks.reduce((acc, stock) => acc + (stock.currentPrice * stock.stocksQuantity), 0);
    const totalYesterdayValueUSD = usdStocks.reduce((acc, stock) => {
        const yesterdayPrice = stock.currentPrice / (1 + (Number(stock.dayPriceChangePercent) || 0));
        return acc + (yesterdayPrice * stock.stocksQuantity);
    }, 0);

    const carteiraValorizacaoDiaUSD = totalYesterdayValueUSD > 0
        ? ((totalCurrentValueUSD_Day - totalYesterdayValueUSD) / totalYesterdayValueUSD) * 100
        : 0;

    let valorizacaoTotalBRL = 0
    let valorizacaoTotalUSD = 0

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
                                    ref={searchInputRef}
                                />
                                <button className='search-input-button' onClick={handleSearch}>Search</button>
                                <CloseIcon className='close-search-stock-icon' onClick={() => {
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
                                setTimeout(() => {
                                    if (searchInputRef.current) {
                                        searchInputRef.current.focus();
                                    }
                                }, 0);
                            }}></SearchIcon>
                        }

                        {updatedStocksList.length > 0 ? null :
                            <p className='no-stocks-message'>Search for a stock to add it to your portfolio.</p>
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
                                        <h3 className='stock-data-price'>
                                            {formatCurrency(stockClicked.currentPrice, stockClicked.currency || 'BRL')}
                                        </h3>
                                    </div>

                                    <div className='stock-data-close-addIcon'>
                                        <CloseIcon className='stock-data-closeIcon' onClick={handleCloseIconResultsContainer}></CloseIcon>
                                        <AddIcon className='stock-data-addIcon' onClick={handleAddStock}></AddIcon>
                                    </div>
                                </div> : null}
                        </div>

                    </div>

                    {stocksList.filter(stock => stock.currency === 'BRL').length > 0 ?
                        <h2 className='stocks-list-title-BRL'>BRL Stocks</h2>
                        : null
                    }

                    <div className='stocks-list-container'>
                        {stocksList.filter(stock => stock.currency === 'BRL').length > 0 ? (
                            <div className="table-wrapper">
                                <table className='stocks-table'>
                                    <thead>
                                        <tr>
                                            <th className="sticky-column">Symbol</th>
                                            <th>Current Price</th>
                                            <th>Avg Price</th>
                                            <th>Daily Return</th>
                                            <th>Stock Return</th>
                                            <th>Return & Div</th>
                                            <th>Total Value</th>
                                            <th>Gain</th>
                                            <th>Dividends</th>
                                            <th>Stock Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {updatedStocksList
                                            .filter(stock => stock.currency === 'BRL') // Filtra apenas ações em BRL
                                            .slice() // cria uma cópia para não alterar o estado original
                                            .sort((a, b) => {
                                                const dividendsA = dividendsList[a.symbol.replace('.SA', '')] || 0;
                                                const dividendsB = dividendsList[b.symbol.replace('.SA', '')] || 0;
                                                const totalPercA = (
                                                    (((a.currentPrice * a.stocksQuantity + dividendsA) - (a.averagePrice * a.stocksQuantity)) /
                                                        (a.averagePrice * a.stocksQuantity)) * 100
                                                );
                                                const totalPercB = (
                                                    (((b.currentPrice * b.stocksQuantity + dividendsB) - (b.averagePrice * b.stocksQuantity)) /
                                                        (b.averagePrice * b.stocksQuantity)) * 100
                                                );
                                                return totalPercB - totalPercA; // ordem decrescente
                                            })
                                            .map((stock, index) => {
                                                // Calcula valorização individual
                                                const invested = stock.averagePrice * stock.stocksQuantity;
                                                const current = stock.currentPrice * stock.stocksQuantity;
                                                const percentageDifference = ((current - invested) / invested) * 100;
                                                const isPositive = percentageDifference >= 0;
                                                const valorizacaoBRL = (current - invested)
                                                valorizacaoTotalBRL += valorizacaoBRL;

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
                                                            {formatCurrency(stock.currentPrice, stock.currency)}
                                                        </td>

                                                        <td>{formatCurrency(Number(stock.averagePrice), stock.currency).replace(/^R\$ |^\$ /,'')}</td>

                                                        <td style={{ color: (Number(stock.dayPriceChangePercent)) > 0 ? 'var(--chart-price-line)' : 'red' }}>
                                                            {stock.dayPriceChangePercent ? formatPercent(Number(stock.dayPriceChangePercent) * 100) : null}
                                                        </td>

                                                        <td style={{ color: isPositive ? 'var(--chart-price-line)' : 'red' }}>
                                                            {isFinite(Number(percentageDifference)) && Number(percentageDifference) !== 0
                                                                ? formatPercent(Number(percentageDifference))
                                                                : null}
                                                        </td>

                                                        <td style={{ color: isPositiveWithDividends ? 'var(--chart-price-line)' : 'red' }}>
                                                            {dividends > 0 && isFinite(Number(totalPercentageDifference)) && Number(totalPercentageDifference) !== 0
                                                                ? formatPercent(Number(totalPercentageDifference))
                                                                : null}
                                                        </td>
                                                        <td>
                                                            {formatCurrency(totalValue, stock.currency)}
                                                        </td>

                                                        <td style={{ color: isPositive ? 'var(--chart-price-line)' : 'red' }}>
                                                            {formatCurrency(valorizacaoBRL, 'BRL')}
                                                        </td>
                                                        <td>
                                                            {formatCurrency(dividends, stock.currency)}
                                                        </td>
                                                        <td>{stock.stocksQuantity}</td>
                                                    </tr>
                                                );
                                            })}

                                        {/* Adiciona a última linha com os totais */}
                                        <tr>
                                            <td className="sticky-column"><strong>Total</strong></td>
                                            <td></td>
                                            <td>
                                                <strong>
                                                    {formatCurrency(updatedStocksList
                                                        .filter(stock => stock.currency === 'BRL')
                                                        .reduce((acc, stock) => acc + stock.averagePrice * stock.stocksQuantity, 0), 'BRL').replace('R$ ','')}
                                                </strong>
                                            </td>
                                            <td style={{ color: carteiraValorizacaoDia >= 0 ? 'var(--chart-price-line)' : 'red' }}>
                                                <strong>
                                                    {formatPercent(Number(carteiraValorizacaoDia))}
                                                </strong>
                                            </td>

                                            <td>
                                                <strong>
                                                    {formatPercent(percentualValorizacaoBRL)}
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {formatPercent(totalReturnPercent)}
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {formatCurrency(updatedStocksList
                                                        .filter(stock => stock.currency === 'BRL')
                                                        .reduce((acc, stock) => acc + (stock.currentPrice * stock.stocksQuantity), 0), 'BRL')}
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {formatCurrency(valorizacaoTotalBRL, 'BRL')}
                                                </strong>

                                            </td>
                                            <td>
                                                <strong>
                                                    {formatCurrency(updatedStocksList
                                                        .filter(stock => stock.currency === 'BRL')
                                                        .reduce((acc, stock) => {
                                                            const dividends = dividendsList[stock.symbol.replace('.SA', '')] || 0;
                                                            return acc + dividends;
                                                        }, 0), 'BRL')}
                                                </strong>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </div>

                    <div className="stocks-container-all">

                        {stocksList.filter(stock => stock.currency === 'USD').length > 0 ?
                            <h2 className='stocks-list-title-USD'>US Stocks</h2>
                            : null
                        }

                        <div className='stocks-list-container'>
                            {stocksList.filter(stock => stock.currency === 'USD').length > 0 ? (
                                <div className="table-wrapper">
                                    <table className='stocks-table'>
                                        <thead>
                                            <tr>
                                                <th className="sticky-column">Symbol</th>
                                                <th>Current Price</th>
                                                <th>Avg Price</th>
                                                <th>Daily Return</th>
                                                <th>Stock Return</th>
                                                <th>Return & Div</th>
                                                <th>Total Value</th>
                                                <th>Gain</th>
                                                <th>Dividends</th>
                                                <th>Stock Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {updatedStocksList
                                                .filter(stock => stock.currency === 'USD') // Filtra apenas ações em USD
                                                .slice() // cria uma cópia para não alterar o estado original
                                                .sort((a, b) => {
                                                    const dividendsA = dividendsList[a.symbol.replace('.SA', '')] || 0;
                                                    const dividendsB = dividendsList[b.symbol.replace('.SA', '')] || 0;
                                                    const totalPercA = (
                                                        (((a.currentPrice * a.stocksQuantity + dividendsA) - (a.averagePrice * a.stocksQuantity)) /
                                                            (a.averagePrice * a.stocksQuantity)) * 100
                                                    );
                                                    const totalPercB = (
                                                        (((b.currentPrice * b.stocksQuantity + dividendsB) - (b.averagePrice * b.stocksQuantity)) /
                                                            (b.averagePrice * b.stocksQuantity)) * 100
                                                    );
                                                    return totalPercB - totalPercA; // ordem decrescente
                                                })
                                                .map((stock, index) => {
                                                    const priceDifference = stock.currentPrice - stock.averagePrice;
                                                    const percentageDifference = ((priceDifference / stock.averagePrice) * 100).toFixed(2);
                                                    const isPositive = priceDifference >= 0;

                                                    const invested = stock.averagePrice * stock.stocksQuantity;
                                                    const current = stock.currentPrice * stock.stocksQuantity;
                                                    const valorizacaoUSD = (current - invested)
                                                    valorizacaoTotalUSD += valorizacaoUSD;

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
                                                                {formatCurrency(stock.currentPrice, stock.currency)}
                                                            </td>
                                                            <td>{formatCurrency(Number(stock.averagePrice), stock.currency).replace(/^R\$ |^\$ /,'')}</td>

                                                            <td style={{ color: Number(stock.dayPriceChangePercent) > 0 ? 'var(--chart-price-line)' : 'red' }}>
                                                                {stock.dayPriceChangePercent ? formatPercent(Number(stock.dayPriceChangePercent) * 100) : null}
                                                            </td>

                                                            <td style={{ color: isPositive ? 'var(--chart-price-line)' : 'red' }}>
                                                                {isFinite(Number(percentageDifference)) && Number(percentageDifference) !== 0
                                                                    ? formatPercent(Number(percentageDifference))
                                                                    : null}
                                                            </td>

                                                            <td style={{ color: isPositiveWithDividends ? 'var(--chart-price-line)' : 'red' }}>
                                                                {dividends > 0 && isFinite(Number(totalPercentageDifference)) && Number(totalPercentageDifference) !== 0
                                                                    ? formatPercent(Number(totalPercentageDifference))
                                                                    : null}
                                                            </td>
                                                            <td>{formatCurrency(totalValue, stock.currency)}</td>

                                                            <td style={{ color: isPositive ? 'var(--chart-price-line)' : 'red' }}>
                                                                {formatCurrency(valorizacaoUSD, 'USD')}
                                                            </td>
                                                            <td>{formatCurrency(dividends, stock.currency)}</td>
                                                            <td>{Number(stock.stocksQuantity)}</td>
                                                        </tr>
                                                    );
                                                })}

                                            {/* Adiciona a última linha com os totais */}
                                            <tr>
                                                <td className="sticky-column"><strong>Total</strong></td>
                                                <td></td>
                                                <td>
                                                    <strong>
                                                        {formatCurrency(updatedStocksList
                                                            .filter(stock => stock.currency === 'USD')
                                                            .reduce((acc, stock) => acc + stock.averagePrice * stock.stocksQuantity, 0), 'USD').replace('$ ','')}
                                                    </strong>
                                                </td>

                                                <td style={{ color: carteiraValorizacaoDiaUSD >= 0 ? 'var(--chart-price-line)' : 'red' }}>
                                                    <strong>
                                                        {formatPercent(Number(carteiraValorizacaoDiaUSD))}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <strong>
                                                        {formatPercent(percentualValorizacaoUSD)}
                                                    </strong>
                                                </td>
                                                <td>

                                                </td>
                                                <td>
                                                    <strong>
                                                        {formatCurrency(updatedStocksList
                                                            .filter(stock => stock.currency === 'USD')
                                                            .reduce((acc, stock) => acc + (stock.currentPrice * stock.stocksQuantity), 0), 'USD')}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <strong>
                                                        {formatCurrency(valorizacaoTotalUSD, 'USD')}
                                                    </strong>
                                                </td>
                                                <td></td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                        </div>

                        <div style={{ marginTop: '40px' }}>
                            <Snapshots
                                userId={typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null}
                            />
                        </div>

                        <h2 className='footer'>Yield Management</h2>
                    </div>
                </div>
            }
        </>
    )
}

export default Stocks