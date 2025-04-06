import './Dividends.css'
import { getAllDividends } from '../../services/dividends'
import { useEffect, useState } from 'react'

const Dividends = () => {

    const [dividendsList, setDividendsList] = useState([])
    const [filteredDividends, setFilteredDividends] = useState([])
    const [groupedDividends, setGroupedDividends] = useState({})
    const [overallStartDate, setOverallStartDate] = useState('')
    const [overallEndDate, setOverallEndDate] = useState('')
    const [showingAllPeriod, setShowingAllPeriod] = useState(false)
    const [detailedDividends, setDetailedDividends] = useState([])
    const [showingDetailed, setShowingDetailed] = useState(false)

    useEffect(() => {
        const fetchDividends = async () => {
            try {
                const dividends = await getAllDividends()
                setDividendsList(dividends)

                // Calcula as datas de início e fim gerais
                const startDate = dividends.reduce(
                    (earliest, dividend) =>
                        new Date(dividend.liquidacao) < new Date(earliest)
                            ? dividend.liquidacao
                            : earliest,
                    dividends[0]?.liquidacao || ''
                );

                const endDate = dividends.reduce(
                    (latest, dividend) =>
                        new Date(dividend.liquidacao) > new Date(latest)
                            ? dividend.liquidacao
                            : latest,
                    dividends[0]?.liquidacao || ''
                );

                // Formata as datas no formato DD/MM/YYYY
                setOverallStartDate(new Date(startDate).toLocaleDateString('pt-BR'));
                setOverallEndDate(new Date(endDate).toLocaleDateString('pt-BR'));

            } catch (error) {
                console.error('Error fetching dividends:', error)
            }
        }

        fetchDividends()
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
            const ticker = dividend.ticker.replace(/\d+/g, '')
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
    };

    const filterByLastThreeMonths = () => {
        const now = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        const filtered = dividendsList.filter(dividend => {
            const date = new Date(dividend.liquidacao);
            return date >= threeMonthsAgo && date <= now;
        });
        setFilteredDividends(filtered);
        setShowingAllPeriod(false);
        setShowingDetailed(false);
    };

    const filterByAllTime = () => {
        setFilteredDividends(dividendsList);
        setShowingAllPeriod(true);
        setShowingDetailed(false);
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
    }

    const simpleDividends = () => {
        setShowingDetailed(false);
    }

    return (
        <div className="dividends-container">
            <h1 className='dividends-title'>Dividends</h1>
            {showingAllPeriod ? <p>Overall Date: {overallStartDate} - {overallEndDate}</p> : null}

            {/* Botões de filtro */}
            <div className='dividends-buttons'>
                <button onClick={filterByCurrentMonth} className='dividends-button'>This Month</button>
                <button onClick={filterByCurrentYear} className='dividends-button'>This Year</button>
                <button onClick={filterByLastThreeMonths} className='dividends-button'>Last 3 Months</button>
                <button onClick={filterByAllTime} className='dividends-button'>All Period</button>
            </div>
            <div className='dividends-detailed'>
                <button onClick={simpleDividends} className='dividends-detailed-button'>Simple</button>
                <button onClick={handleDetailedDividends} className='dividends-detailed-button'>Detailed</button>
            </div>            
            {showingDetailed ? (
                detailedDividends.length > 0 ?(
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
            Object.keys(groupedDividends).length > 0 ?(
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