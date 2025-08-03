import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Logon from './components/Logon';
import Dividends from './components/Dividends'
import Stocks from './components/Stocks';
import Info from './components/Info';
import Menu from './components/Menu';
import AddData from './components/AddData';
import { fetchDividendsStocks, filteredDividends, dividends } from './components/Connect';
import { useEffect, useState } from 'react'
import CookieConsent from './components/CookieConsent';
import dragon from './assets/sleeping-dragon.png'
import { getBrokers } from './services/brokers';
import { getAllTotalValues } from './services/totalValues';
import Home from './components/Home';
import { getAllCreditCards } from './services/creditCards';


function App() {

  const [dataLoaded, setDataLoaded] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [brokersData, setBrokerData] = useState([])
  const [totalValuesData, setTotalValuesData] = useState([])
  const [cardValues, setCardValues] = useState([])
  const [fetchingAgain, setFetchingAgain] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [cookieAccepted, setCookieAccepted] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  useEffect(() => {
    if (isLoggedIn && cookieAccepted) {
      const userId = sessionStorage.getItem('userId');
      const loadData = async () => {
        await fetchDividendsStocks()
        setDataLoaded(true)
        const brokersResult = await getBrokers(userId);
        const totalValuesResult = await getAllTotalValues(userId);  
        const cardValuesResult = await getAllCreditCards(userId);
        setCardValues(cardValuesResult);              
        setBrokerData(brokersResult);
        setTotalValuesData(totalValuesResult)
        setFetchingAgain(prev => prev + 1)
      }
      loadData()
    }
  }, [refresh, isLoggedIn, cookieAccepted])

  return (
    <>
      <CookieConsent onAccept={() => setCookieAccepted(true)} />
      <BrowserRouter>
        {!isLoggedIn ? (
          <Home onLogin={handleLogin} />
        ) : !cookieAccepted ? (
          <div className="loading-container">
            <h1 className="loading-text">Aguardando consentimento de cookies...</h1>
          </div>
        ) : !dataLoaded ? (
          <div className="loading-container">
            <h1 className="loading-text">Loading your treasuries...</h1>
            <img src={dragon} alt='Loading' className='loading-image' />
          </div>
        ) : (
          <>
            <Menu setIsLoggedIn={setIsLoggedIn} />
            <Routes>
              <Route path="/home" element={<Home onLogin={handleLogin} />} />
              <Route path="/logon" element={<Logon />} />
              <Route path="/" element={<Stocks fetchingAgain={fetchingAgain} setRefresh={setRefresh} />} />
              <Route path="/dividends" element={<Dividends fetchingAgain={fetchingAgain} />} />
              <Route path="/info" element={<Info filteredDividends={filteredDividends}
                dividends={dividends}
                brokersData={brokersData}
                totalValuesData={totalValuesData}
                cardValues={cardValues}
                fetchingAgain={fetchingAgain}
                setRefresh={setRefresh}
              />} />
              <Route path='/add' element={<AddData setRefresh={setRefresh} totalValuesData={totalValuesData} />} />
              <Route path="*" element={<h1>404 Not Found</h1>} />
            </Routes>
          </>
        )}
      </BrowserRouter>
    </>
  );
}

export default App;