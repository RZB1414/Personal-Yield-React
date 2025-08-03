import React, { useEffect, useRef, useState } from 'react';
import { addBroker } from '../../services/brokers';
import './Brokers.css';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';
import { ReactComponent as AddIcon } from '../../assets/icons/add-circle-icon.svg';
import { ReactComponent as SearchIcon } from '../../assets/icons/search-icon.svg';
import { ReactComponent as DeleteIcon } from '../../assets/icons/delete-icon.svg';
import { addTotalValue, deleteTotalValue } from '../../services/totalValues';

const Brokers = ({ brokersData, totalValuesData, setRefresh, fetchingAgain }) => {
    const [brokers, setBrokers] = useState(brokersData || []);
    const [newBrokerName, setNewBrokerName] = useState('');
    const [newBrokerCurrency, setNewBrokerCurrency] = useState('');
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [isAddingBroker, setIsAddingBroker] = useState(false);
    const [isAddingTotalValue, setIsAddingTotalValue] = useState(false);
    const [isSearchingTotalValue, setIsSearchingTotalValue] = useState(false);
    const [totalValues, setTotalValues] = useState(totalValuesData || []);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchBroker, setSearchBroker] = useState('');
    const [searchMonth, setSearchMonth] = useState('');
    const [dollarRate, setDollarRate] = useState(null);
    const [amountBRL, setAmountBRL] = useState('');
    const [amountUSD, setAmountUSD] = useState('');
    const [lastChanged, setLastChanged] = useState(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        setSelectedYear(new Date().getFullYear());
        setBrokers(brokersData || []);
        setTotalValues(totalValuesData);

        console.log('totalvaluesData', totalValuesData);
        
        
    }, [brokersData, totalValuesData, fetchingAgain])

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const availableYears = [...new Set(totalValues.map(value => new Date(value.date).getFullYear()))];
    

    const getBrokerMonthlyTotals = (broker, monthIndex, year = selectedYear) => {
        const monthlyValue = totalValues.find(value => {
            if (!value.date) return false;
            const [y, m] = value.date.split('-');
            return (
                value.broker.broker === broker &&
                Number(m) - 1 === monthIndex &&
                Number(y) === year
            );
        });

        const totalUSD = monthlyValue ? parseFloat(monthlyValue.totalValueInUSD || 0) : 0;
        const totalBRL = monthlyValue ? parseFloat(monthlyValue.totalValueInBRL || 0) : 0;

        return { totalUSD, totalBRL };
    };

    const handleAddBroker = async () => {
        if (newBrokerName.trim() !== '' && newBrokerCurrency.trim() !== '') {
            const userId = sessionStorage.getItem('userId');
            try {
                const newBroker = {
                    brokerName: newBrokerName,
                    currency: newBrokerCurrency,
                    userId: userId
                };
                const addedBroker = await addBroker(newBroker);
                setBrokers([...brokers, addedBroker]);
                setNewBrokerName('');
                setNewBrokerCurrency('');
                setIsAddingBroker(false);
            } catch (error) {
                console.error('Error adding broker:', error);
            }
        }
    };

    const handleSelectBroker = (event) => {
        const selectedBrokerName = event.target.value;
        const broker = brokers.find(b => b.broker === selectedBrokerName);
        setSelectedBroker(broker)
    };

    const handleAddTotalValue = async (event) => {
        event.preventDefault();
        const userId = sessionStorage.getItem('userId')
        const date = event.target[0].value; // já está no formato 'YYYY-MM-DD'
        const amountInUSD = event.target[1].value;
        const amountInBRL = event.target[2].value;
        if (date && amountInBRL && amountInUSD && selectedBroker) {
            const totalValue = {
                date: date, // envie a string, não o objeto Date
                currency: selectedBroker.currency,
                totalValueInBRL: amountInBRL,
                totalValueInUSD: amountInUSD,
                broker: selectedBroker,
                userId: userId
            };
            try {
                const result = await addTotalValue(totalValue);
                setRefresh(prevRefresh => prevRefresh + 1)
                alert(result.msg)
                setIsAddingTotalValue(false);
                setAmountBRL('');
                setAmountUSD('');
                setDollarRate(null);
            } catch (error) {
                alert('Error adding total value:', error.msg);
            }
        } else {
            alert('Please fill in all fields and select a broker');
        }
    };

    const calculateMonthlyTotals = () => {
        const monthlyTotals = months.map((_, monthIndex) => {
            let totalUSD = 0;
            let totalBRL = 0;

            totalValues.forEach(value => {
                const [year, month] = value.date.split('-');
                if (
                    Number(month) - 1 === monthIndex &&
                    Number(year) === selectedYear
                ) {
                    totalUSD += parseFloat(value.totalValueInUSD || 0);
                    totalBRL += parseFloat(value.totalValueInBRL || 0);
                }
            })

            return { totalUSD, totalBRL };
        });

        return monthlyTotals;
    };

    // Função para filtrar os valores conforme busca
    const filteredTotalValues = totalValues.filter(value => {
        const [year, month] = value.date.split('-');
        const matchesYear = Number(year) === selectedYear;
        const matchesBroker = searchBroker ? value.broker.broker === searchBroker : true;
        const matchesMonth = searchMonth ? Number(month) === Number(searchMonth) : true;
        return matchesYear && matchesBroker && matchesMonth;
    });

    // Brokers e meses únicos para os selects
    const uniqueBrokers = [...new Set(totalValues
        .filter(v => Number(v.date.split('-')[0]) === selectedYear)
        .map(v => v.broker.broker)
    )];
    const uniqueMonths = [...new Set(totalValues
        .filter(v => Number(v.date.split('-')[0]) === selectedYear)
        .map(v => Number(v.date.split('-')[1]))
    )].sort((a, b) => a - b);

    const handleDeleteTotalValue = async (event) => {
        const id = event._id;
        if (id) {
            try {
                const result = await deleteTotalValue(id)
                setIsSearchingTotalValue(false)
                setSearchBroker('');
                setSearchMonth('');
                alert(result.message)
                setRefresh(prevRefresh => prevRefresh + 1)
            } catch (error) {
                alert('Error deleting total value:', error.msg)
            }
        } else {
            alert('Please select a total value to delete')
        }
    }

    // Função para calcular o percentual de valorização
    const getValorization = (broker, monthIndex, year = selectedYear) => {
        // Valor atual
        const current = totalValues.find(value => {
            if (!value.date) return false;
            const [y, m] = value.date.split('-');
            return (
                value.broker.broker === broker &&
                Number(m) - 1 === monthIndex &&
                Number(y) === year
            );
        });

        // Descobrir mês e ano anterior
        let prevMonth = monthIndex - 1;
        let prevYear = year;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear = year - 1;
        }

        // Valor anterior
        const previous = totalValues.find(value => {
            if (!value.date) return false;
            const [y, m] = value.date.split('-');
            return (
                value.broker.broker === broker &&
                Number(m) - 1 === prevMonth &&
                Number(y) === prevYear
            );
        });

        // Se não houver valor anterior, retorna null
        if (!current || !previous) return null;

        // Calcula percentual de valorização para USD e BRL
        const valorizationUSD = previous.totalValueInUSD && previous.totalValueInUSD !== "0"
            ? ((parseFloat(current.totalValueInUSD) - parseFloat(previous.totalValueInUSD)) / Math.abs(parseFloat(previous.totalValueInUSD))) * 100
            : null;
        const valorizationBRL = previous.totalValueInBRL && previous.totalValueInBRL !== "0"
            ? ((parseFloat(current.totalValueInBRL) - parseFloat(previous.totalValueInBRL)) / Math.abs(parseFloat(previous.totalValueInBRL))) * 100
            : null;

        return {
            valorizationUSD,
            valorizationBRL
        };
    };

    const getTotalValorization = (currency, monthIndex, year = selectedYear) => {
        // Valor atual
        const monthlyTotals = calculateMonthlyTotals();
        const current = monthlyTotals[monthIndex];

        // Descobrir mês e ano anterior
        let prevMonth = monthIndex - 1;
        let prevYear = year;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear = year - 1;
        }

        // Para ano anterior, recalcule os totais daquele ano
        let previous;
        if (prevYear !== year) {
            // Filtra totalValues para o ano anterior
            const prevYearTotals = months.map((_, idx) => {
                let totalUSD = 0;
                let totalBRL = 0;
                totalValues.forEach(value => {
                    const [y, m] = value.date.split('-');
                    if (
                        Number(m) - 1 === idx &&
                        Number(y) === prevYear
                    ) {
                        totalUSD += parseFloat(value.totalValueInUSD || 0);
                        totalBRL += parseFloat(value.totalValueInBRL || 0);
                    }
                });
                return { totalUSD, totalBRL };
            });
            previous = prevYearTotals[prevMonth];
        } else {
            previous = monthlyTotals[prevMonth];
        }

        if (!current || !previous) return null;

        if (currency === 'USD') {
            return previous.totalUSD && previous.totalUSD !== 0
                ? ((current.totalUSD - previous.totalUSD) / Math.abs(previous.totalUSD)) * 100
                : null;
        } else {
            return previous.totalBRL && previous.totalBRL !== 0
                ? ((current.totalBRL - previous.totalBRL) / Math.abs(previous.totalBRL)) * 100
                : null;
        }
    }

    const fetchDollarRate = async (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        const apiDate = `${year}${month}${day}`;
        const url = `https://economia.awesomeapi.com.br/json/daily/USD-BRL/?start_date=${apiDate}&end_date=${apiDate}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data[0]) {
            setDollarRate(parseFloat(data[0].bid.replace(',', '.')));
        } else {
            setDollarRate(null);
        }
    };

    // Atualiza USD quando BRL muda
    useEffect(() => {
        if (lastChanged === 'BRL' && dollarRate && amountBRL !== '') {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setAmountUSD((parseFloat(amountBRL) / parseFloat(dollarRate)).toString());
            }, 1000);
        }
        // eslint-disable-next-line
    }, [amountBRL, dollarRate]);

    // Atualiza BRL quando USD muda
    useEffect(() => {
        if (lastChanged === 'USD' && dollarRate && amountUSD !== '') {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setAmountBRL((parseFloat(amountUSD) * parseFloat(dollarRate)).toString());
            }, 1000);
        }
        // eslint-disable-next-line
    }, [amountUSD, dollarRate]);

    return (
        <>
            {isAddingTotalValue ?
                <div className='broker-container'>
                    <h2 className='broker-tittle'>Brokers</h2>
                    <CloseIcon className='broker-close-icon' onClick={() => {
                        setIsAddingTotalValue(false);
                        setIsAddingBroker(false);
                        setSelectedBroker(null);
                        setAmountBRL('');
                        setAmountUSD('');
                        setDollarRate(null);
                    }} />
                    {isAddingBroker ?
                        <div className='broker-add-container'>
                            <CloseIcon className='broker-close-icon' onClick={() => setIsAddingBroker(false)} />
                            <input
                                className='broker-input'
                                type="text"
                                value={newBrokerName}
                                onChange={(e) => setNewBrokerName(e.target.value)}
                                placeholder="Broker Name"
                            />
                            <input
                                className='broker-input'
                                type="text"
                                value={newBrokerCurrency}
                                onChange={(e) => setNewBrokerCurrency(e.target.value)}
                                placeholder="Currency"
                            />
                            <button className='broker-button' onClick={handleAddBroker}>Add Broker</button>
                        </div>
                        : null
                    }

                    <div>
                        <label className='broker-label' htmlFor="brokerSelect">Select a Broker:</label>
                        <select
                            className='broker-select'
                            id="brokerSelect"
                            onChange={(e) => {
                                if (e.target.value === "Add New Broker") {
                                    setIsAddingBroker(true);
                                    setSelectedBroker(null);
                                    setNewBrokerName('');
                                    setNewBrokerCurrency('');
                                } else {
                                    handleSelectBroker(e);
                                    setIsAddingBroker(false);
                                }
                            }}
                        >
                            <option className='broker-option' value="">-- Select --</option>
                            {brokers.map((broker, index) => (
                                <option key={index} value={broker.broker}>
                                    {broker.broker} ({broker.currency})
                                </option>
                            ))}
                            <option className='broker-option' value="Add New Broker">Add New Broker</option>
                        </select>
                    </div>
                    <form onSubmit={handleAddTotalValue} className='broker-form'>
                        <input
                            className='broker-input'
                            type="date"
                            placeholder="Date"
                            onChange={(e) => {
                                fetchDollarRate(e.target.value);
                            }}
                        />
                        <div className='broker-amount-container'>
                            <input
                                className='broker-input'
                                type="number"
                                placeholder="Total Amount"
                                value={amountUSD}
                                onChange={e => {
                                    setAmountUSD(e.target.value);
                                    setLastChanged('USD');
                                }}
                            />
                            {selectedBroker ?
                                <p>USD</p>
                                : null
                            }
                        </div>

                        {dollarRate && (
                            <div style={{ marginTop: 8, marginLeft: 20, color: '#3182ce' }}>
                                USD/BRL: R$ {parseFloat(dollarRate).toFixed(4)}
                            </div>
                        )}

                        <div className='broker-amount-container'>
                            <input
                                className='broker-input'
                                type="number"
                                placeholder="Total Amount"
                                value={amountBRL}
                                onChange={e => {
                                    setAmountBRL(e.target.value);
                                    setLastChanged('BRL');
                                }}
                            />
                            {selectedBroker ?
                                <p>BRL</p>
                                : null
                            }
                        </div>
                        <button className='broker-button' type="submit">Add Total Value</button>

                    </form>
                </div>
                : null
            }

            <div className='year-selector' style={{ marginTop: '20px' }}>
                <label className='year-select' style={{ border: 0 }} htmlFor="yearSelect">Select Year:</label>
                <select
                    className='year-select'
                    id="yearSelect"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    {availableYears.map((year, index) => (
                        <option key={index} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            <div className='broker-header'>
                <h2 className='broker-tittle'>Monthly Totals</h2>
                <SearchIcon className='broker-search-icon' onClick={() => setIsSearchingTotalValue(true)} />
                <AddIcon className='broker-add-icon' onClick={() => setIsAddingTotalValue(true)} />
            </div>

            {isSearchingTotalValue ?
                <div className='total-value-search'>
                    <div>
                        <label htmlFor="searchBroker">Broker:</label>
                        <select
                            id="searchBroker"
                            value={searchBroker}
                            onChange={e => setSearchBroker(e.target.value)}
                        >
                            <option value="">--</option>
                            {uniqueBrokers.map((broker, idx) => (
                                <option key={idx} value={broker}>{broker}</option>
                            ))}
                        </select>
                        <label htmlFor="searchMonth" style={{ marginLeft: 10 }}>Month:</label>
                        <select
                            id="searchMonth"
                            value={searchMonth}
                            onChange={e => setSearchMonth(e.target.value)}
                        >
                            <option value="">--</option>
                            {uniqueMonths.map(m => (
                                <option key={m} value={m}>{months[m - 1]}</option>
                            ))}
                        </select>
                    </div>
                    <CloseIcon className='broker-close-icon' onClick={() => {
                        setIsSearchingTotalValue(false)
                        setSearchBroker('');
                        setSearchMonth('');
                    }
                    }
                    />

                    <div className='broker-search-results'>
                        {(searchBroker && searchMonth && filteredTotalValues.length > 0) ? (
                            <ul>
                                {filteredTotalValues.map((value, index) => (
                                    <li key={index}>
                                        <p>{value.broker.broker} - {months[Number(value.date.split('-')[1]) - 1]} - {Number(value.totalValueInUSD).toFixed(2)} USD / {Number(value.totalValueInBRL).toFixed(2)} BRL</p>
                                        <DeleteIcon className='broker-delete-icon' onClick={() => handleDeleteTotalValue(value)} />
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                </div>
                : null
            }



            {totalValues ?
                <div className='broker-table-wrapper'>
                    <table className='broker-table'>
                        <thead>
                            <tr>
                                <th>Broker</th>
                                {months.map((month, index) => (
                                    <React.Fragment key={index}>
                                        <th>{month}</th>
                                        <th>%</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {brokers
                                .filter(broker => {
                                    // Verifica se o broker tem algum valor no ano selecionado
                                    return totalValues.some(value => {
                                        if (!value.date) return false;
                                        const [year] = value.date.split('-');
                                        return value.broker.broker === broker.broker && Number(year) === selectedYear && (
                                            parseFloat(value.totalValueInUSD || 0) > 0 ||
                                            parseFloat(value.totalValueInBRL || 0) > 0
                                        );
                                    });
                                })
                                .map((broker, brokerIndex) => (
                                    <React.Fragment key={brokerIndex}>
                                        <tr>
                                            <td className='broker-name'>{broker.broker}</td>
                                        </tr>
                                        <tr>
                                            <td>USD</td>
                                            {months.map((_, monthIndex) => {
                                                const { totalUSD } = getBrokerMonthlyTotals(broker.broker, monthIndex);
                                                const valorization = getValorization(broker.broker, monthIndex);
                                                const color = valorization && valorization.valorizationUSD !== null
                                                    ? valorization.valorizationUSD < 0 ? '#e53e3e' : '#3182ce'
                                                    : '#3182ce';
                                                return (
                                                    <React.Fragment key={monthIndex}>
                                                        <td>{totalUSD.toFixed(2)}</td>
                                                        <td style={{ fontSize: '0.95em', color: color }}>
                                                            {valorization && valorization.valorizationUSD !== null
                                                                ? `${valorization.valorizationUSD.toFixed(2)}%`
                                                                : '--'}
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            <td>BRL</td>
                                            {months.map((_, monthIndex) => {
                                                const { totalBRL } = getBrokerMonthlyTotals(broker.broker, monthIndex);
                                                const valorization = getValorization(broker.broker, monthIndex);
                                                const color = valorization && valorization.valorizationBRL !== null
                                                    ? valorization.valorizationBRL < 0 ? '#e53e3e' : '#3182ce'
                                                    : '#3182ce';
                                                return (
                                                    <React.Fragment key={monthIndex}>
                                                        <td>{totalBRL.toFixed(2)}</td>

                                                        <td style={{ fontSize: '0.95em', color: color }}>
                                                            {valorization && valorization.valorizationBRL !== null
                                                                ? `${valorization.valorizationBRL.toFixed(2)}%`
                                                                : '--'}
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tr>

                                    </React.Fragment>
                                ))}
                            <tr className='total-row'>
                                <td>Total USD</td>
                                {calculateMonthlyTotals().map((totals, monthIndex) => {
                                    const valorization = getTotalValorization('USD', monthIndex);
                                    const color = valorization !== null
                                        ? valorization < 0 ? '#e53e3e' : '#3182ce'
                                        : '#3182ce';
                                    return (
                                        <React.Fragment key={monthIndex}>
                                            <td>{totals.totalUSD.toFixed(2)}</td>
                                            <td style={{ fontSize: '0.95em', color }}>
                                                {valorization !== null
                                                    ? `${valorization.toFixed(2)}%`
                                                    : '--'}
                                            </td>
                                        </React.Fragment>
                                    )
                                })}
                            </tr>
                            <tr className='total-row'>
                                <td>Total BRL</td>
                                {calculateMonthlyTotals().map((totals, monthIndex) => {
                                    const valorization = getTotalValorization('BRL', monthIndex);
                                    const color = valorization !== null
                                        ? valorization < 0 ? '#e53e3e' : '#3182ce'
                                        : '#3182ce';
                                    return (
                                        <React.Fragment key={monthIndex}>
                                            <td>{totals.totalBRL.toFixed(2)}</td>
                                            <td style={{ fontSize: '0.95em', color }}>
                                                {valorization !== null
                                                    ? `${valorization.toFixed(2)}%`
                                                    : '--'}
                                            </td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
                : <p className='broker-no-data'>Loading...</p>}

            <h2 className='footer'>Yield Management</h2>
        </>
    );
};

export default Brokers;