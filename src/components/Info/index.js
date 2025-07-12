import Brokers from '../Brokers';
import './Info.css';
import { useEffect, useState } from 'react';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';
import { ReactComponent as DeleteIcon } from '../../assets/icons/delete-icon.svg';
import { deleteCardTransaction } from '../../services/creditCards';

const Info = ({ filteredDividends, dividends, brokersData, totalValuesData, cardValues, fetchingAgain,setRefresh }) => {

    const [groupedByTicker, setGroupedByTicker] = useState({});
    const [monthCardsClicked, setMonthCardsClicked] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Inicializa com o ano atual

    useEffect(() => {
        const grouped = groupDividendsByTicker(filteredDividends)
        setGroupedByTicker(grouped)                
        
    }, [dividends, filteredDividends, selectedYear, cardValues]);


    // Função para agrupar dividendos por ticker, ano e mês
    const groupDividendsByTicker = (dividends) => {
        const grouped = {};
        dividends.forEach((dividend) => {
            const date = new Date(dividend.liquidacao);
            const year = date.getFullYear();
            const month = date.toLocaleString('default', { month: 'long' });
            const ticker = dividend.ticker;

            if (!grouped[ticker]) {
                grouped[ticker] = { total: 0 };
            }

            if (!grouped[ticker][month]) {
                grouped[ticker][month] = 0;
            }

            if (year === selectedYear) {
                grouped[ticker][month] += dividend.valor;
                grouped[ticker].total += dividend.valor;
            }
        });

        return grouped;
    };




    // Obtém os anos disponíveis
    const getAvailableYears = () => {
        const years = [...new Set(dividends.dividends.map(dividend => new Date(dividend.liquidacao).getFullYear()))];
        return years.sort((a, b) => b - a); // Ordena em ordem decrescente
    };

    // Função para lidar com o clique em um mês específico
    const handleCardsOfMonth = (cards, month) => {
        const monthCards = cards.filter(card => new Date(card.date).toLocaleString('default', { month: 'long' }) === month);
        if (monthCards.length > 0) {
            setMonthCardsClicked(monthCards);
        } else {
            alert(`No cards found for ${month}`);
        }
    }

    return (
        <>

        <div className="dividends-container">
            
            {/* Botão para selecionar o ano */}
            <div className="year-selector">
                <label htmlFor="year-select">Select Year:</label>
                <select
                    id="year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="year-select"
                >
                    {getAvailableYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {Object.keys(groupedByTicker).length > 0 ? (
                <div className="table-wrapper">
                    <table className="stocks-table">
                        <thead>
                            <tr>
                                <th className="sticky-column">Ticker</th>
                                {Array.from({ length: 12 }, (_, i) =>
                                    new Date(0, i).toLocaleString('default', { month: 'long' })
                                ).map((month) => (
                                    <th key={month}>{month}</th>
                                ))}
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Linha 1: NOTA */}
                            <tr>
                                <td className="sticky-column">Nota</td>
                                {Array.from({ length: 12 }, (_, i) =>
                                    new Date(0, i).toLocaleString('default', { month: 'long' })
                                ).map((month) => (
                                    <td className='month-cell' key={month}>{groupedByTicker["NOTA"]?.[month] ? `R$ ${groupedByTicker["NOTA"][month].toFixed(2)}` : '-'}</td>
                                ))}
                                <td className='month-cell-total'>{groupedByTicker["NOTA"]?.total ? `R$ ${groupedByTicker["NOTA"].total.toFixed(2)}` : '-'}</td>
                            </tr>

                            {/* Linha 2: RENDIMENTO RENDA FIXA */}
                            <tr>
                                <td className="sticky-column">Rendimento Renda Fixa</td>
                                {Array.from({ length: 12 }, (_, i) =>
                                    new Date(0, i).toLocaleString('default', { month: 'long' })
                                ).map((month) => (
                                    <td className='month-cell' key={month}>{groupedByTicker["RENDIMENTO RENDA FIXA"]?.[month] ? `R$ ${groupedByTicker["RENDIMENTO RENDA FIXA"][month].toFixed(2)}` : '-'}</td>
                                ))}
                                <td className='month-cell-total'>{groupedByTicker["RENDIMENTO RENDA FIXA"]?.total ? `R$ ${groupedByTicker["RENDIMENTO RENDA FIXA"].total.toFixed(2)}` : '-'}</td>
                            </tr>

                            {/* Linha 3: CARTAO DE CREDITO */}
                            <tr>
                                <td className="sticky-column">Cartão XP</td>
                                {Array.from({ length: 12 }, (_, i) =>
                                    new Date(0, i).toLocaleString('default', { month: 'long' })
                                ).map((month) => (
                                    <td className='month-cell' key={month}>{groupedByTicker["CARTAO DE CREDITO"]?.[month] ? `R$ ${groupedByTicker["CARTAO DE CREDITO"][month].toFixed(2)}` : '-'}</td>
                                ))}
                                <td className='month-cell-total'>{groupedByTicker["CARTAO DE CREDITO"]?.total ? `R$ ${groupedByTicker["CARTAO DE CREDITO"].total.toFixed(2)}` : '-'}</td>
                            </tr>

                            {/* Linha 4: CASHBACK CARTAO */}
                            <tr>
                                <td className="sticky-column">Cashback Cartão</td>
                                {Array.from({ length: 12 }, (_, i) =>
                                    new Date(0, i).toLocaleString('default', { month: 'long' })
                                ).map((month) => (
                                    <td className='month-cell' key={month}>{groupedByTicker["CASHBACK CARTAO"]?.[month] ? `R$ ${groupedByTicker["CASHBACK CARTAO"][month].toFixed(2)}` : '-'}</td>
                                ))}
                                <td className='month-cell-total'>{groupedByTicker["CASHBACK CARTAO"]?.total ? `R$ ${groupedByTicker["CASHBACK CARTAO"].total.toFixed(2)}` : '-'}</td>
                            </tr>
                            {/* Linha 5: CREDIT CARDS */}
                            <tr>
                                <td className="sticky-column">Cartões de Crédito</td>
                                {Array.from({ length: 12 }, (_, i) =>
                                    new Date(0, i).toLocaleString('default', { month: 'long' })
                                ).map((month) => {
                                    const cardsOfMonth = cardValues.filter(card => new Date(card.date).getFullYear() === selectedYear && new Date(card.date).toLocaleString('default', { month: 'long' }) === month);
                                    const total = cardsOfMonth.reduce((acc, card) => acc + card.value, 0);
                                    return (
                                        <td
                                            className='month-cell'
                                            key={month}
                                            style={{ cursor: total > 0 ? 'pointer' : 'default' }}
                                            onClick={() => {
                                                if (total > 0) {
                                                    handleCardsOfMonth(cardsOfMonth, month)
                                                }
                                            }}
                                        >
                                            {total > 0 ? `R$ ${total.toFixed(2)}` : '-'}
                                        </td>
                                    );
                                })}
                                <td className='month-cell-total'>
                                    {cardValues.filter(card => new Date(card.date).getFullYear() === selectedYear)
                                        .reduce((acc, card) => acc + card.value, 0) > 0 ? 
                                        `R$ ${cardValues.filter(card => new Date(card.date).getFullYear() === selectedYear)
                                            .reduce((acc, card) => acc + card.value, 0).toFixed(2)}` : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className='dividends-no-data'>No data available for {selectedYear}</p>
            )}
        </div>

        <div className="cards-of-month-container">
            {monthCardsClicked.length > 0 ? (
                <div className="cards-of-month">
                    <h2>Cartões para {monthCardsClicked[0] && new Date(monthCardsClicked[0].date).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <ul>
                        {monthCardsClicked.map((card, idx) => (
                            <li key={card._id || card.id || idx}>
                                {card.name || card.bank}: R$ {card.value.toFixed(2)}
                                <DeleteIcon
                                    className="delete-cardicon"
                                    onClick={async () => {
                                        await deleteCardTransaction(card._id);
                                        cardValues.splice(cardValues.indexOf(card), 1); // Remove the card from the local state
                                        setRefresh(prev => prev + 1)
                                        setMonthCardsClicked([])
                                    }}
                                />
                            </li>
                        ))}
                    </ul>
                    <CloseIcon className="close-icon" onClick={() => setMonthCardsClicked([])} />
                </div>
            ) : null }
        </div>

        <Brokers brokersData={brokersData} totalValuesData={totalValuesData} fetchingAgain={fetchingAgain} setRefresh={setRefresh}/>
        </>
    );
};

export default Info;