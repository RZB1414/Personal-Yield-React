import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Dividends from './components/Dividends'
import Stocks from './components/Stocks';
import Menu from './components/Menu';

function App() {
  return (
    <BrowserRouter>
      <Menu />
      <Routes>
        <Route path="/" element={<Stocks />} />
        <Route path="/dividends" element={<Dividends />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
