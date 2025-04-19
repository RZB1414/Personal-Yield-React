import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Dividends from './components/Dividends'
import Stocks from './components/Stocks';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/stocks" element={<Stocks />} />
        <Route path="/dividends" element={<Dividends />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
