import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Dividends from './components/Dividends'
import Stocks from './components/Stocks';
import Info from './components/Info';
import Menu from './components/Menu';
import AddData from './components/AddData';

function App() {
  return (
    <BrowserRouter>
      <Menu />
      <Routes>
        <Route path="/" element={<Stocks />} />
        <Route path="/dividends" element={<Dividends />} />
        <Route path="/info" element={<Info />} />
        <Route path='/add' element={<AddData />} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
