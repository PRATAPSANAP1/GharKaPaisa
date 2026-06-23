import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from './components/Partner/ThemeContext';
import GkpLoader from './components/GkpLoader';
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
        {loading && <GkpLoader />}
        <Suspense fallback={<GkpLoader />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
