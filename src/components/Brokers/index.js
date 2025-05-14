import React, { useEffect, useState } from 'react';
import { addBroker } from '../../services/brokers';
import './Brokers.css';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';
import { ReactComponent as AddIcon } from '../../assets/icons/add-circle-icon.svg';
import { addTotalValue, updateTotalValue } from '../../services/totalValues'

const Brokers = ({ brokersData, totalValuesData }) => {
    const [brokers, setBrokers] = useState(brokersData || []);
    const [newBrokerName, setNewBrokerName] = useState('');
    const [newBrokerCurrency, setNewBrokerCurrency] = useState('');
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [isAddingBroker, setIsAddingBroker] = useState(false);
    const [isAddingTotalValue, setIsAddingTotalValue] = useState(false);
    const [totalValues, setTotalValues] = useState(totalValuesData || []);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    useEffect(() => {
        setSelectedYear(new Date().getFullYear());
        setBrokers(brokersData || []);
        setTotalValues(totalValuesData || []);
    }, [brokersData, totalValuesData])

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    // Obter os anos disponíveis com base nos dados
    const availableYears = [...new Set(totalValues.map(value => new Date(value.date).getFullYear()))]

    const getBrokerMonthlyTotals = (broker, monthIndex, year = selectedYear) => {
        const monthlyValues = totalValues.filter(value => {
            const date = new Date(value.date);
            return (
                value.broker.broker === broker &&
                date.getMonth() === monthIndex &&
                date.getFullYear() === year
            )
        });

        const totalUSD = monthlyValues.reduce((sum, value) => sum + parseFloat(value.totalValueInUSD || 0), 0);
        const totalBRL = monthlyValues.reduce((sum, value) => sum + parseFloat(value.totalValueInBRL || 0), 0);

        return { totalUSD, totalBRL };
    }

    const handleAddBroker = async () => {
        if (newBrokerName.trim() !== '' && newBrokerCurrency.trim() !== '') {
            try {
                const newBroker = {
                    brokerName: newBrokerName,
                    currency: newBrokerCurrency,
                };
                const addedBroker = await addBroker(newBroker);
                setBrokers([...brokers, addedBroker]); // Update the list with the new broker
                setNewBrokerName('')
                setNewBrokerCurrency('')
                setIsAddingBroker(false)
            } catch (error) {
                console.error('Error adding broker:', error);
            }
        }
    }

    const handleSelectBroker = (event) => {
        const selectedBrokerName = event.target.value;
        const broker = brokers.find(b => b.broker === selectedBrokerName);
        setSelectedBroker(broker)
        console.log('Selected broker:', broker);
    }

    const handleAddTotalValue = async (event) => {
        event.preventDefault();
        const date = event.target[0].value;
        const amountInUSD = event.target[1].value;
        const amountInBRL = event.target[2].value;
        if (date && amountInBRL && amountInUSD && selectedBroker) {
            const totalValue = {
                date: date,
                currency: selectedBroker.currency,
                totalValueInBRL: amountInBRL,
                totalValueInUSD: amountInUSD,
                broker: selectedBroker
            };
            try {
                const result = await addTotalValue(totalValue)
                alert(result.msg)
                setTotalValues([...totalValues, totalValue])
                setIsAddingTotalValue(false)
            } catch (error) {
                alert('Error adding total value:', error.message);
            }
        } else {
            alert('Please fill in all fields and select a broker');
        }
    }

    const calculateMonthlyTotals = () => {
        const monthlyTotals = months.map((_, monthIndex) => {
            let totalUSD = 0;
            let totalBRL = 0;

            totalValues.forEach(value => {
                const date = new Date(value.date);
                if (date.getMonth() === monthIndex && date.getFullYear() === selectedYear) {
                    totalUSD += parseFloat(value.totalValueInUSD || 0);
                    totalBRL += parseFloat(value.totalValueInBRL || 0);
                }
            });

            return { totalUSD, totalBRL };
        });

        return monthlyTotals;
    };

    return (
        <>
            {isAddingTotalValue ?
                <div className='broker-container'>
                    <h2 className='broker-tittle'>Brokers</h2>
                    <CloseIcon className='broker-close-icon' onClick={() => {
                        setIsAddingTotalValue(false) 
                        setIsAddingBroker(false)}} />
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
                        />
                        <div className='broker-amount-container'>
                            <input
                                className='broker-input'
                                type="number"
                                placeholder="Total Amount"
                            />
                            {selectedBroker ?
                                <p>USD</p>
                                : null
                            }
                        </div>
                        <div className='broker-amount-container'>
                            <input
                                className='broker-input'
                                type="number"
                                placeholder="Total Amount"
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

            {/* Select para os anos disponíveis */}
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
                <AddIcon className='broker-add-icon' onClick={() => setIsAddingTotalValue(true)} />
            </div>

            {totalValues ?
                <div className='broker-table-wrapper'>
                    <table className='broker-table'>
                        <thead>
                            <tr>
                                <th>Broker</th>

                                {months.map((month, index) => (
                                    <th key={index}>{month}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {brokers.map((broker, brokerIndex) => (
                                <React.Fragment key={brokerIndex}>
                                    {/* Linha com o nome do broker */}
                                    <tr>
                                        <td className='broker-name'>{broker.broker}</td>
                                        {/* Célula vazia para alinhar com o cabeçalho */}
                                    </tr>
                                    {/* Linha para valores em USD */}
                                    <tr>
                                        {/* Célula vazia para alinhar com o cabeçalho */}
                                        <td>USD</td>
                                        {months.map((_, monthIndex) => {
                                            const { totalUSD } = getBrokerMonthlyTotals(broker.broker, monthIndex)
                                            let prevTotalUSD = 0;

                                            if (monthIndex === 0) {
                                                // Se for janeiro, comparar com dezembro do ano anterior
                                                const { totalUSD: prevYearTotalUSD } = getBrokerMonthlyTotals(broker.broker, 11, selectedYear - 1) || { totalUSD: 0 };
                                                prevTotalUSD = prevYearTotalUSD;
                                            } else {
                                                // Comparar com o mês anterior
                                                const { totalUSD: prevMonthTotalUSD } = getBrokerMonthlyTotals(broker.broker, monthIndex - 1) || { totalUSD: 0 };
                                                prevTotalUSD = prevMonthTotalUSD;
                                            }

                                            const valorizationUSD = prevTotalUSD > 0 ? ((totalUSD - prevTotalUSD) / prevTotalUSD) * 100 : 0

                                            const handleLongPress = (broker, monthIndex, type) => {
                                                const timer = setTimeout(() => {
                                                    const newValue = prompt(`Edit ${type} value for ${months[monthIndex]}:`, totalUSD.toFixed(2));
                                                    if (newValue !== null) {
                                                        const updatedValue = {
                                                            broker: broker,
                                                            monthIndex: monthIndex,
                                                            type: type,
                                                            newValue: parseFloat(newValue),
                                                        };
                                                        handleUpdateTotalValue(updatedValue);
                                                    }
                                                }, 500); // 500ms para considerar como clique longo
                                        
                                                return () => clearTimeout(timer); // Limpa o timer se o clique for solto antes
                                            };
                                        
                                            const handleUpdateTotalValue = async (updatedValue) => {
                                                try {
                                                    const result = await updateTotalValue(updatedValue); // Chama a função de atualização
                                                    console.log(result);
                                                    
                                                    alert(result.msg || 'Value updated successfully!');
                                                    // Atualiza o estado local após a atualização
                                                    setTotalValues((prevValues) =>
                                                        prevValues.map((value) => {
                                                            const date = new Date(value.date);
                                                            if (
                                                                value.broker.broker === updatedValue.broker &&
                                                                date.getMonth() === updatedValue.monthIndex &&
                                                                updatedValue.type === 'USD'
                                                            ) {
                                                                return { ...value, totalValueInUSD: updatedValue.newValue };
                                                            } else if (
                                                                value.broker.broker === updatedValue.broker &&
                                                                date.getMonth() === updatedValue.monthIndex &&
                                                                updatedValue.type === 'BRL'
                                                            ) {
                                                                return { ...value, totalValueInBRL: updatedValue.newValue };
                                                            }
                                                            return value;
                                                        })
                                                    );
                                                } catch (error) {
                                                    alert('Error updating value: ' + error.message);
                                                }
                                            }
                                            return (
                                                <td 
                                                    key={monthIndex}
                                                    onMouseDown={() => handleLongPress(broker.broker, monthIndex, 'USD')}
                                                    onMouseUp={() => clearTimeout(handleLongPress)}
                                                    onMouseLeave={() => clearTimeout(handleLongPress)}
                                                    onTouchStart={() => handleLongPress(broker.broker, monthIndex, 'USD')}
                                                    onTouchEnd={() => clearTimeout(handleLongPress)}
                                                >
                                                    {totalUSD.toFixed(2)}
                                                    {valorizationUSD !== 0 && (
                                                        <span className={valorizationUSD > 0 ? 'positive' : 'negative'}>
                                                            {Math.round(valorizationUSD)}%
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {/* Linha para valores em BRL */}
                                    <tr>
                                        {/* Célula vazia para alinhar com o cabeçalho */}
                                        <td>BRL</td>
                                        {months.map((_, monthIndex) => {
                                            const { totalBRL } = getBrokerMonthlyTotals(broker.broker, monthIndex)
                                            let prevTotalBRL = 0

                                            if (monthIndex === 0) {
                                                // Se for janeiro, comparar com dezembro do ano anterior
                                                const { totalBRL: prevYearTotalBRL } = getBrokerMonthlyTotals(broker.broker, 11, selectedYear - 1) || { totalBRL: 0 };
                                                prevTotalBRL = prevYearTotalBRL;
                                            } else {
                                                // Comparar com o mês anterior
                                                const { totalBRL: prevMonthTotalBRL } = getBrokerMonthlyTotals(broker.broker, monthIndex - 1) || { totalBRL: 0 };
                                                prevTotalBRL = prevMonthTotalBRL;
                                            }

                                            const valorizationBRL = prevTotalBRL > 0 ? ((totalBRL - prevTotalBRL) / prevTotalBRL) * 100 : 0;
                                            return (
                                                <td key={monthIndex} >
                                                    {totalBRL.toFixed(2)}
                                                    {valorizationBRL !== 0 && (
                                                        <span className={valorizationBRL > 0 ? 'positive' : 'negative'}>
                                                            {Math.round(valorizationBRL)}%
                                                        </span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                </React.Fragment>
                            ))}
                            {/* Linhas de totais mensais */}
                            <tr className='total-row'>
                                <td>Total USD</td>
                                {calculateMonthlyTotals().map((totals, monthIndex) => {
                                    let prevTotalUSD = 0;

                                    if (monthIndex === 0) {
                                        // Se for janeiro, comparar com dezembro do ano anterior
                                        const prevYearTotals = calculateMonthlyTotals(selectedYear - 1);
                                        prevTotalUSD = prevYearTotals.length > 0 ? prevYearTotals[11]?.totalUSD || 0 : 0;
                                    } else {
                                        // Comparar com o mês anterior
                                        prevTotalUSD = calculateMonthlyTotals()[monthIndex - 1]?.totalUSD || 0;
                                    }

                                    const valorizationUSD = prevTotalUSD > 0 ? ((totals.totalUSD - prevTotalUSD) / prevTotalUSD) * 100 : 0;

                                    return (
                                        <td key={monthIndex}>
                                            {totals.totalUSD.toFixed(2)}
                                            {valorizationUSD !== 0 && (
                                                <span className={valorizationUSD > 0 ? 'positive' : 'negative'}>
                                                    {Math.round(valorizationUSD)}%
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr className='total-row'>
                                <td>Total BRL</td>
                                {calculateMonthlyTotals().map((totals, monthIndex) => {
                                    let prevTotalBRL = 0;

                                    if (monthIndex === 0) {
                                        // Se for janeiro, comparar com dezembro do ano anterior
                                        const prevYearTotals = calculateMonthlyTotals(selectedYear - 1);
                                        prevTotalBRL = prevYearTotals.length > 0 ? prevYearTotals[11]?.totalBRL || 0 : 0;
                                    } else {
                                        // Comparar com o mês anterior
                                        prevTotalBRL = calculateMonthlyTotals()[monthIndex - 1]?.totalBRL || 0;
                                    }

                                    const valorizationBRL = prevTotalBRL > 0 ? ((totals.totalBRL - prevTotalBRL) / prevTotalBRL) * 100 : 0;

                                    return (
                                        <td key={monthIndex}>
                                            {totals.totalBRL.toFixed(2)}
                                            {valorizationBRL !== 0 && (
                                                <span className={valorizationBRL > 0 ? 'positive' : 'negative'}>
                                                    {Math.round(valorizationBRL)}%
                                                </span>
                                            )}
                                        </td>
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