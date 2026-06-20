import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from './components/Partner/ThemeContext';
import LoadingLogo from './components/LoadingLogo';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLoader = (e) => {
      setLoading(e.detail);
    };

    window.addEventListener('loader', handleLoader);

    return () => {
      window.removeEventListener('loader', handleLoader);
    };
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        {loading && <LoadingLogo />}
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
