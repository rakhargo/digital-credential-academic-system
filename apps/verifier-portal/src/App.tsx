import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VerifierPage from './pages/VerifierPage';
import Login from './pages/sso/Login';
import Register from './pages/sso/Register';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VerifierPage />} /> 
        
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<VerifierPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;