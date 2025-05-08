import React, { useState } from 'react';
import { addBroker } from '../../services/brokers';
import './Brokers.css';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';
import { ReactComponent as AddIcon } from '../../assets/icons/add-circle-icon.svg';
import { addTotalValue } from '../../services/totalValues'

const Brokers = ({ brokersData, totalValuesData }) => {
    const [brokers, setBrokers] = useState(brokersData || []);
    const [newBrokerName, setNewBrokerName] = useState('');
    const [newBrokerCurrency, setNewBrokerCurrency] = useState('');
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [isAddingBroker, setIsAddingBroker] = useState(false);
    const [isAddingTotalValue, setIsAddingTotalValue] = useState(false);
    const [totalValues, setTotalValues] = useState(totalValuesData || []);

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const getBrokerMonthlyTotals = (broker, monthIndex) => {
        const monthlyValues = totalValues.filter(value => {
            const date = new Date(value.date);
            return value.broker.broker === broker && date.getMonth() === monthIndex;
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
                setNewBrokerName('');
                setNewBrokerCurrency('');
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
                await addTotalValue(totalValue);
                setTotalValues([...totalValues, totalValue])
                setIsAddingTotalValue(false)
            } catch (error) {
                console.error('Error adding total value:', error);
            }
        } else {
            console.error('Please fill in all fields and select a broker.');
        }
    }

    const calculateMonthlyTotals = () => {
        const monthlyTotals = months.map((_, monthIndex) => {
            let totalUSD = 0;
            let totalBRL = 0;

            totalValues.forEach(value => {
                const date = new Date(value.date);
                if (date.getMonth() === monthIndex) {
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

            <div className='broker-header'>
                <h2 className='broker-tittle'>Monthly Totals</h2>
                <AddIcon className='broker-add-icon' onClick={() => setIsAddingTotalValue(true)} />
            </div>

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
                                        const { totalUSD } = getBrokerMonthlyTotals(broker.broker, monthIndex);
                                        return <td key={monthIndex}>{totalUSD.toFixed(2)}</td>;
                                    })}
                                </tr>
                                {/* Linha para valores em BRL */}
                                <tr>
                                    {/* Célula vazia para alinhar com o cabeçalho */}
                                    <td>BRL</td>
                                    {months.map((_, monthIndex) => {
                                        const { totalBRL } = getBrokerMonthlyTotals(broker.broker, monthIndex);
                                        return <td key={monthIndex}>{totalBRL.toFixed(2)}</td>;
                                    })}
                                </tr>
                            </React.Fragment>
                        ))}
                        {/* Linhas de totais mensais */}
                        <tr className='total-row'>
                            <td>Total USD</td>
                            {calculateMonthlyTotals().map((totals, monthIndex) => (
                                <td key={monthIndex}>{totals.totalUSD.toFixed(2)}</td>
                            ))}
                        </tr>
                        <tr className='total-row'>
                            <td>Total BRL</td>
                            {calculateMonthlyTotals().map((totals, monthIndex) => (
                                <td key={monthIndex}>{totals.totalBRL.toFixed(2)}</td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
            <h2 className='footer'>Yield Management</h2>
        </>
    );
};

export default Brokers;