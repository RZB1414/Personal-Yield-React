import './Dividends.css'
import { useEffect, useState } from 'react'
import { dividends } from '../Connect'

const Dividends = () => {

    const [dividendsList, setDividendsList] = useState([])
    const [filteredDividends, setFilteredDividends] = useState([])
    const [groupedDividends, setGroupedDividends] = useState({})
    const [overallStartDate, setOverallStartDate] = useState('')
    const [overallEndDate, setOverallEndDate] = useState('')
    const [showingAllPeriod, setShowingAllPeriod] = useState(false)
    const [detailedDividends, setDetailedDividends] = useState([])
    const [showingDetailed, setShowingDetailed] = useState(false)
    const [selectedYear, setSelectedYear] = useState('')
    const [showYearFilter, setShowYearFilter] = useState(false)

    useEffect(() => {

        setDividendsList(dividends.dividends)

        // Calcula as datas de início e fim gerais
        const startDate = dividends.dividends.reduce(
            (earliest, dividend) =>
                new Date(dividend.liquidacao) < new Date(earliest)
                    ? dividend.liquidacao
                    : earliest,
            dividends.dividends[0]?.liquidacao || ''
        );

        const endDate = dividends.dividends.reduce(
            (latest, dividend) =>
                new Date(dividend.liquidacao) > new Date(latest)
                    ? dividend.liquidacao
                    : latest,
            dividends.dividends[0]?.liquidacao || ''
        );

        // Formata as datas no formato DD/MM/YYYY
        setOverallStartDate(new Date(startDate).toLocaleDateString('pt-BR'));
        setOverallEndDate(new Date(endDate).toLocaleDateString('pt-BR'));

    }, [])

    useEffect(() => {
        // Agrupa os dividendos por ticker e soma os valores
        const grouped = groupDividendsByTicker(filteredDividends)
        setGroupedDividends(grouped)
    }, [filteredDividends])

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

    // Funções de filtro
    const filterByCurrentMonth = () => {
        const now = new Date();
        const filtered = dividendsList.filter(dividend => {
            const date = new Date(dividend.liquidacao);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
        setFilteredDividends(filtered);
        setShowingAllPeriod(false);
        setShowingDetailed(false);
        setShowYearFilter(false);
    };

    const filterByCurrentYear = () => {
        const now = new Date();
        const filtered = dividendsList.filter(dividend => {
            const date = new Date(dividend.liquidacao);
            return date.getFullYear() === now.getFullYear();
        });
        setFilteredDividends(filtered);
        setShowingAllPeriod(false);
        setShowingDetailed(false);
        setShowYearFilter(false);
    };

    const filterByYear = () => {
        const filtered = dividendsList.filter(dividend => {
            const date = new Date(dividend.liquidacao);
            return date.getFullYear() === selectedYear;
        });
        setFilteredDividends(filtered);
        setShowingAllPeriod(false);
        setShowingDetailed(false);
        setShowYearFilter(false);
    };

    const filterByAllTime = () => {
        setFilteredDividends(dividendsList);
        setShowingAllPeriod(true);
        setShowingDetailed(false);
        setShowYearFilter(false);
    };

    const handleDetailedDividends = () => {
        const detailedDividendsList = filteredDividends.map(dividend => {
            const date = new Date(dividend.liquidacao).toLocaleDateString('pt-BR');
            return {
                ...dividend,
                liquidacao: date
            };
        });
        setDetailedDividends(detailedDividendsList);
        setShowingAllPeriod(false);
        setShowingDetailed(true);
        setShowYearFilter(false);
    }

    const simpleDividends = () => {
        setShowingDetailed(false);
    }

    const getAvailableYears = () => {
        // Extrai os anos únicos da lista de dividendos
        const years = [...new Set(dividendsList.map(dividend => new Date(dividend.liquidacao).getFullYear()))];
        return years.sort((a, b) => b - a); // Ordena os anos em ordem decrescente
    }

    const yearFilter = () => {
        setShowYearFilter(!showYearFilter)
    }

    return (
        <div className="dividends-container">
            <h1 className='dividends-title'>Dividends</h1>
            {showingAllPeriod ? <p>Overall Date: {overallStartDate} - {overallEndDate}</p> : null}

            {/* Botões de filtro */}
            <div className='dividends-buttons'>
                <button onClick={filterByCurrentMonth} className='dividends-button'>This Month</button>
                <button onClick={filterByCurrentYear} className='dividends-button'>This year</button>
                <button onClick={yearFilter} className='dividends-button'>By year</button>
                <button onClick={filterByAllTime} className='dividends-button'>All Period</button>
            </div>
            <div className='dividends-detailed'>
                <button onClick={simpleDividends} className='dividends-detailed-button'>Simple</button>
                <button onClick={handleDetailedDividends} className='dividends-detailed-button'>Detailed</button>
            </div>

            {/* Campo de seleção de ano */}
            {showYearFilter && (
                <div className='dividends-year-filter'>
                    <label htmlFor="year-select">Select Year:</label>
                    <select
                        id="year-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className='dividends-year-select'
                    >
                        {getAvailableYears().map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <button onClick={filterByYear} className='dividends-byyear-button'>Filter by Year</button>
                </div>
            )}

            {/* Soma total */}
            <h3 className='dividends-total'>
                Total: R$ {showingDetailed
                    ? detailedDividends.reduce((sum, dividend) => sum + dividend.valor, 0).toFixed(2)
                    : Object.values(groupedDividends).reduce((sum, total) => sum + total, 0).toFixed(2)}
            </h3>

            {showingDetailed ? (
                detailedDividends.length > 0 ? (
                    <ul className='dividends-list'>
                        {detailedDividends.map((dividend, index) => (
                            <li className='dividends-list-item' key={index}>
                                <p>{dividend.liquidacao}</p>
                                <p className='dividends-list-item-ticker'>{dividend.ticker}</p>
                                <p>{dividend.valor.toFixed(2)}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className='dividends-no-data'>No results for this period</p>
                )) : null}

            {showingDetailed ? null :
                Object.keys(groupedDividends).length > 0 ? (
                    <ul className='dividends-list'>
                        {Object.entries(groupedDividends)
                            .sort(([, totalA], [, totalB]) => totalB - totalA)
                            .map(([ticker, total]) => (
                                <li className='dividends-list-item' key={ticker}>
                                    <p>{ticker}</p>
                                    <p>R$ {total.toFixed(2)}</p>
                                </li>
                            ))}
                    </ul>
                ) : (
                    <p className='dividends-no-data'>No results for this period</p>
                )}

        </div>
    )
}

export default Dividends