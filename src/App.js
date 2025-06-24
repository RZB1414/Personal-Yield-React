import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Logon from './components/Logon';
import Dividends from './components/Dividends'
import Stocks from './components/Stocks';
import Info from './components/Info';
import Menu from './components/Menu';
import AddData from './components/AddData';
import { fetchDividendsStocks, filteredDividends, dividends, LoginForm } from './components/Connect';
import { useEffect, useState } from 'react'
import dragon from './assets/sleeping-dragon.png'
import { getBrokers } from './services/brokers';
import { getAllTotalValues } from './services/totalValues';
import Home from './components/Home';
// import Login from './components/Login';

function App() {

  const [dataLoaded, setDataLoaded] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [brokersData, setBrokerData] = useState([])
  const [totalValuesData, setTotalValuesData] = useState([])
  const [fetchingAgain, setFetchingAgain] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  useEffect(() => {
    if (isLoggedIn) {
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
    }
  }, [refresh, isLoggedIn])

  return (
    <BrowserRouter>
      {!isLoggedIn ? (
        <Home onLogin={handleLogin} />
      ) : !dataLoaded ? (
        <div className="loading-container">
          <h1 className="loading-text">Loading your treasuries...</h1>
          <img src={dragon} alt='Loading' className='loading-image' />
        </div>
      )
        : (
          <>
            <Menu />
            <Routes>
              <Route path="/home" element={<Home onLogin={handleLogin} />} />
              <Route path="/logon" element={<Logon />} />
              <Route path="/" element={<Stocks fetchingAgain={fetchingAgain} setRefresh={setRefresh} />} />
              <Route path="/dividends" element={<Dividends fetchingAgain={fetchingAgain} />} />
              <Route path="/info" element={<Info filteredDividends={filteredDividends}
                dividends={dividends}
                brokersData={brokersData}
                totalValuesData={totalValuesData}
                fetchingAgain={fetchingAgain}
                setRefresh={setRefresh}
              />} />
              <Route path='/add' element={<AddData setRefresh={setRefresh} />} />
              <Route path="*" element={<h1>404 Not Found</h1>} />
            </Routes>
          </>
        )}

    </BrowserRouter>
  );
}

export default App;