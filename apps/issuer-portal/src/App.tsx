import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IssuerPage from './pages/IssuerPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IssuerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;