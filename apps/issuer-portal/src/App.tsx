import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IssuerPage from './pages/IssuerPage';
import PDDiktiPage from './pages/PDDiktiPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IssuerPage />} />
        <Route path="/pddikti" element={<PDDiktiPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;