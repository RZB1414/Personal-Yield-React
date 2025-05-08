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

function App() {

  const [dataLoaded, setDataLoaded] = useState(false)
  const [stockAdded, setStockAdded] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      await fetchDividendsStocks()
      setDataLoaded(true)
      console.log('Fetch Dividends')      
    }
    loadData()
  }, [stockAdded])

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
        <Route path="/" element={<Stocks stockAdded={stockAdded} setStockAdded={setStockAdded}/>} />
        <Route path="/dividends" element={<Dividends />} />
        <Route path="/info" element={<Info filteredDividends={filteredDividends} dividends={dividends}/>} />
        <Route path='/add' element={<AddData />} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


// import { BrowserRouter, Route, Routes } from 'react-router-dom';
// import './App.css';
// import Dividends from './components/Dividends';
// import Stocks from './components/Stocks';
// import Info from './components/Info';
// import Menu from './components/Menu';
// import AddData from './components/AddData';
// import { fetchDividendsStocks, filteredDividends, dividends } from './components/Connect';
// import { useEffect, useState } from 'react';
// import dragon from './assets/sleeping-dragon.png';

// function App() {
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const [showLoading, setShowLoading] = useState(true); // Controla o carregamento inicial
//   const [continueLoading, setContinueLoading] = useState(false); // Controla se o botão foi clicado
//   const [stockAdded, setStockAdded] = useState(0);

//   useEffect(() => {
//     const loadData = async () => {
//       await fetchDividendsStocks();
//       setDataLoaded(true);
//       console.log('Fetch Dividends');
//     };
//     loadData();
//   }, [stockAdded]);

//   useEffect(() => {
//     // Exibe o carregamento inicial por 4 segundos
//     const timer = setTimeout(() => {
//       setShowLoading(false);
//     }, 4000);

//     return () => clearTimeout(timer); // Limpa o timer ao desmontar o componente
//   }, []);

//   if (showLoading) {
//     return (
//       <div className="loading-container">
//         <h1 className="loading-text">Loading your treasuries...</h1>
//         <img src={dragon} alt="Loading" className="loading-image" />
//       </div>
//     );
//   }

//   if (!continueLoading) {
//     return (
//       <div className="loading-container">
//       <div className="loading-text-box">
//         <h1 className="loading-text">Supertoca, o nosso lar</h1>
//         <p className="loading-text">
//           Ano XV da era Jujubo...<br /><br />
//           A expansão dos insectos do Pântano Infectado do Oriente aumentava a cada dia.
//           Eles se reproduziam como nunca, cada um com no mínimo 3 crias.<br /><br />
//           General Jujubo já estava se preparando para a grande batalha final!
//           Enfrentaria o seu grande inimigo novamente. Uma batalha que duraria apenas um dia, somente uma oportunidade para a conquista.
//           Ele se preparou e passou por inúmeros desafios e dificuldades para chegar até aqui.
//           Estava mais pronto do que nunca!<br /><br />
//           A saudade da família batia muito forte em seu coração, não aguentava mais ficar longe da princess Jujuba e de seus dois gatinhos, Ada e Pom.
//           O ar tóxico e contaminado fazia muito mal a Jujubo, os vírus daqueles seres se espalhavam rapidamente e ele precisava se proteger da maneira que desse.<br /><br />
//           Jujubo seguia seu caminho, caminhando pela escuridão, acompanhado somente pelos seus pensamentos que eram de onde retirava a energia que precisava para alcançar os seus objetivos.
//           Pensamentos nobres, felizes, de um tempo de paz e tranquilidade, de um lugar distante chamado lar, onde se sentava na varanda, com um café quente em sua caneca e tinha ao lado a sua maior jóia, o motivo da sua alegria diária, a sua companheira para a vida toda, princess Jujuba.<br /><br />
//           E os meninos jogados no sofá ao lado admirando aquela cena com seus olhares baixos de sono e pensando, não tem nada melhor que todo mundo juntos na Supertoca!<br /><br />
//           <strong>Jujubos quase juntinhos fisicamente novamente 💜</strong>
//         </p>
//           <button className="continue-button" onClick={() => setContinueLoading(true)}>
//             Continue
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!dataLoaded) {
//     return (
//       <div className="loading-container">
//         <h1 className="loading-text">Loading your treasuries...</h1>
//         <img src={dragon} alt="Loading" className="loading-image" />
//       </div>
//     );
//   }

//   if (!filteredDividends || !dividends) {
//     return (
//       <div className="loading-container">
//         <h1 className="loading-text">Loading...</h1>
//       </div>
//     );
//   }

//   return (
//     <BrowserRouter>
//       <Menu />
//       <Routes>
//         <Route path="/" element={<Stocks stockAdded={stockAdded} setStockAdded={setStockAdded} />} />
//         <Route path="/dividends" element={<Dividends />} />
//         <Route path="/info" element={<Info filteredDividends={filteredDividends} dividends={dividends} />} />
//         <Route path="/add" element={<AddData />} />
//         <Route path="*" element={<h1>404 Not Found</h1>} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;