import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Dividends from './components/Dividends'
import Stocks from './components/Stocks';
import Info from './components/Info';
import Menu from './components/Menu';
import AddData from './components/AddData';
import { fetchDividendsStocks, filteredDividends, dividends } from './components/Connect';
import { useEffect, useState } from 'react'
import dragon from './assets/sleeping-dragon.png'
import { getBrokers } from './services/brokers';
import { getAllTotalValues } from './services/totalValues';

function App() {

  const [dataLoaded, setDataLoaded] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [brokersData, setBrokerData] = useState([])
  const [totalValuesData, setTotalValuesData] = useState([])
  const [fetchingAgain, setFetchingAgain] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      await fetchDividendsStocks()
      setDataLoaded(true)
      const brokersResult = await getBrokers();
      const totalValuesResult = await getAllTotalValues();
      setBrokerData(brokersResult);
      setTotalValuesData(totalValuesResult)
      setFetchingAgain(prev => prev + 1)
    }
    loadData()
    console.log('Data loaded');
    
  }, [refresh])

  if (!dataLoaded) {
    return (
      <div className="loading-container">
        <h1 className="loading-text">Loading your treasuries...</h1>
        <img src={dragon} alt='Loading' className='loading-image'/>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Menu />
      <Routes>
        <Route path="/" element={<Stocks fetchingAgain={fetchingAgain} setRefresh={setRefresh}/>} />
        <Route path="/dividends" element={<Dividends />} />
        <Route path="/info" element={<Info filteredDividends={filteredDividends} dividends={dividends} brokersData={brokersData} totalValuesData={totalValuesData}/>} />
        <Route path='/add' element={<AddData setRefresh={setRefresh}/>} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;