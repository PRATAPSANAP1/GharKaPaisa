import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes';
import { ThemeProvider } from '../contexts/ThemeContext';
import { BanksProvider } from '../contexts/BanksContext';
import GkpLoader from '../components/Loader/GkpLoader';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <BanksProvider>
        <BrowserRouter>
          <Suspense fallback={<GkpLoader />}>
            <AppRoutes />
          </Suspense>
        </BrowserRouter>
      </BanksProvider>
    </ThemeProvider>
  );
}

export default App;
