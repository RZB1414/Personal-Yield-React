import './Dividends.css'
import { useEffect, useState } from 'react'
import { dividends } from '../Connect'

const Dividends = ({ fetchingAgain }) => {

    const [dividendsList, setDividendsList] = useState([])
    const [filteredDividends, setFilteredDividends] = useState([])
    const [groupedDividends, setGroupedDividends] = useState({})
    const [overallStartDate, setOverallStartDate] = useState('')
    const [overallEndDate, setOverallEndDate] = useState('')
    const [showingAllPeriod, setShowingAllPeriod] = useState(false)
    const [detailedDividends, setDetailedDividends] = useState([])
    const [showingDetailed, setShowingDetailed] = useState(false)
    const [selectedYear, setSelectedYear] = useState('')
    const [selectedMonth, setSelectedMonth] = useState('')
    const [showMonthFilter, setShowMonthFilter] = useState(false)
    const [showYearFilter, setShowYearFilter] = useState(false)
    const [noDividends, setNoDividends] = useState(false)

    useEffect(() => {
        if (dividends?.dividends?.length > 0) {
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
        } else {
            setNoDividends(true)
        }
    }, [fetchingAgain])

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
        setShowMonthFilter(false)
    };

    const filterBySelectedMonth = () => {
        const filtered = dividendsList.filter(dividend => {
            const date = new Date(dividend.liquidacao);
            return date.getMonth() === selectedMonth && date.getFullYear() === new Date().getFullYear();
        });
        setFilteredDividends(filtered);
        setShowingAllPeriod(false);
        setShowingDetailed(false);
        setShowYearFilter(false);
    }

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
        setShowMonthFilter(false)
    };

    const filterByYear = () => {
        const filtered = dividendsList.filter(dividend => {
            const date = new Date(dividend.liquidacao);
            return date.getFullYear() === selectedYear;
        });
        setFilteredDividends(filtered);
        setShowingAllPeriod(false);
        setShowingDetailed(false);
        setShowMonthFilter(false)
    };

    const filterByAllTime = () => {
        setFilteredDividends(dividendsList);
        setShowingAllPeriod(true);
        setShowingDetailed(false);
        setShowYearFilter(false);
        setShowMonthFilter(false)
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
        setShowMonthFilter(false)
    }

    const getAvailableMonths = () => {
        // Extrai os meses únicos da lista de dividendos no ano atual
        const now = new Date();
        const currentYear = now.getFullYear();
        const months = [...new Set(
            dividendsList
                .filter(dividend => new Date(dividend.liquidacao).getFullYear() === currentYear)
                .map(dividend => new Date(dividend.liquidacao).getMonth())
        )];
        return months.sort((a, b) => a - b); // Ordena os meses em ordem crescente
    };

    const handleMonthFilter = () => {
        setShowMonthFilter(!showMonthFilter)
        setShowYearFilter(false)
    }

    return (
        <div className="dividends-container">
            <h1 className='dividends-title'>Dividends</h1>

            {noDividends ? (
                <p className='dividends-no-data'>No Dividends To Show</p>
            ) : (
                <>
                    {showingAllPeriod ? <p className='overall-date'>Overall Date: {overallStartDate} - {overallEndDate}</p> : null}

                    {/* Botões de filtro */}
                    <div className='dividends-buttons'>
                        <button onClick={filterByCurrentMonth} className='dividends-button'>This Month</button>
                        <button onClick={handleMonthFilter} className='dividends-button'>By Month</button>
                        <button onClick={filterByCurrentYear} className='dividends-button'>This year</button>
                        <button onClick={yearFilter} className='dividends-button'>By year</button>
                        <button onClick={filterByAllTime} className='dividends-button'>All Period</button>
                    </div>
                    <div className='dividends-detailed'>
                        <button onClick={simpleDividends} className='dividends-detailed-button'>Simple</button>
                        <button onClick={handleDetailedDividends} className='dividends-detailed-button'>Detailed</button>
                    </div>

                    {/* Campo de seleção de mês */}
                    {showMonthFilter && (
                        <div className='dividends-year-filter'>
                            <label htmlFor="month-select">Select Month:</label>
                            <select
                                id="month-select"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className='dividends-year-select'
                            >
                                <option value="">---</option>
                                {getAvailableMonths().map(month => (
                                    <option key={month} value={month}>
                                        {new Date(0, month).toLocaleString('en-US', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <button onClick={filterBySelectedMonth} className='dividends-byyear-button'>Filter by Month</button>
                        </div>
                    )}

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
                                <option value="">---</option>
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
                                        <p className='dividends-list-item-liquidacao'>{dividend.liquidacao}</p>
                                        <p className='dividends-list-item-ticker'>{dividend.ticker}</p>
                                        <p className='dividends-list-item-valor'>{dividend.valor.toFixed(2)}</p>
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
                                            <p className='dividends-simplelist-ticker'>{ticker}</p>
                                            <p className='dividends-simplelist-valor'>R$ {total.toFixed(2)}</p>
                                        </li>
                                    ))}
                            </ul>
                        ) : (
                            <p className='dividends-no-data'>No results for this period</p>
                        )}
                </>
            )}
        </div>
    )
}

export default Dividends