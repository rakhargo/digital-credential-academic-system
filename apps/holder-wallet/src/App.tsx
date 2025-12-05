import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HolderPage from './pages/HolderPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HolderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;