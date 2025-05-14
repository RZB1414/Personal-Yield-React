import './AddData.css';
import { useState } from 'react';
import { createTransaction, readFile } from '../../services/dividends';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';

const AddData = ({ setRefresh }) => {
    const [liquidacao, setLiquidacao] = useState('');
    const [valor, setValor] = useState('');
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isAddingDividends, setIsAddingDividends] = useState(false);
    const [fileName, setFileName] = useState('Select a file')
    const [selectedFile, setSelectedFile] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault();

        const transaction = {
            liquidacao,
            lancamento: "Pagamento para BANCO XP S/A", // Lançamento fixo
            valor: parseFloat(valor), // Converte o valor para número
            ticker: "CARTAO DE CREDITO" // Ticker fixo
        };

        try {
            const response = await createTransaction(transaction);
            console.log('Transaction created:', response);
            alert('Transaction successfully created!');
        } catch (error) {
            console.error('Error creating transaction:', error);
            alert('Failed to create transaction.');
        }
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0]; // Obtém o arquivo selecionado
        if (!file) {
            setFileName('Select a file');
            setSelectedFile(null);
            return;
        }

        setFileName(file.name); // Atualiza o nome do arquivo selecionado
        setSelectedFile(file); // Armazena o arquivo no estado
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('Please select a file first.');
            return;
        }

        try {
            await readFile(selectedFile)
            setRefresh(prevRefresh => prevRefresh + 1)
            setIsAddingDividends(false)
            setFileName('Select a file')
            setSelectedFile(null)
            alert('File uploaded and processed successfully!');
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload and process the file.');
        }
    };

    return (
        <div className="add-data-container">
            {isAddingDividends ? null :
                <h2 onClick={() => setIsAddingCard(true)}>New Credit Card Transaction</h2>
            }
            {isAddingCard ? (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <CloseIcon className='close-card-icon' onClick={() => setIsAddingCard(false)} />
                        <label htmlFor="liquidacao">Liquidacao:</label>
                        <input
                            type="date"
                            id="liquidacao"                            
                            value={liquidacao}
                            onChange={(e) => setLiquidacao(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="valor">Valor:</label>
                        <input
                            type="number"
                            id="valor"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            step="0.01"
                            required
                        />
                    </div>
                    <button className='add-transaction-button' type="submit">Add Transaction</button>
                </form>
            )
                : null
            }

            {isAddingCard ? null
                :
                <div>
                    <h2 onClick={() => setIsAddingDividends(true)}>Add New Dividends File</h2>
                </div>
            }


            {isAddingDividends ?
                <div className="file-upload-container">
                    <div className="file-upload-closebutton">
                    <CloseIcon className='close-card-icon' onClick={() => {
                        setIsAddingDividends(false) 
                        setSelectedFile(null)
                        setFileName('Select a file')} 
                    }/>  
                    </div>
                    <label htmlFor="file-upload" className="file-upload-label">
                        {fileName}
                    </label>
                    <input
                        type="file"
                        id="file-upload"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="file-upload-input"
                    />
                    <button
                        className="upload-file-button"
                        onClick={handleFileUpload}
                        disabled={!selectedFile} // Desabilita o botão se nenhum arquivo for selecionado
                    >
                        Upload File
                    </button>                    
                </div>
                : null
            }

        </div>
    );
};

export default AddData;