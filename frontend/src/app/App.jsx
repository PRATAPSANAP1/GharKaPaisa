import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes';
import { ThemeProvider } from '../contexts/ThemeContext';
import { BanksProvider } from '../contexts/BanksContext';
import GkpLoader from '../components/Loader/GkpLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BanksProvider>
          <BrowserRouter>
            <Suspense fallback={<GkpLoader />}>
              <AppRoutes />
            </Suspense>
          </BrowserRouter>
        </BanksProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
