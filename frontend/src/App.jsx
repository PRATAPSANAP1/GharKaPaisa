import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import PartnerPanel from './components/PartnerPanel';
import { ThemeProvider } from './components/Partner/ThemeContext';

import Home from './components/Home';
import Contact from './components/Contact';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <ThemeProvider>
      <div className="App">
        {currentPage === 'partner' ? (
          <PartnerPanel onBackToMain={() => setCurrentPage('home')} />
        ) : currentPage === 'contact' ? (
          <>
            <Navbar onPartnerLoginClick={() => setCurrentPage('partner')} onNavigate={setCurrentPage} />
            <Contact onNavigate={setCurrentPage} />
          </>
        ) : (
          <>
            <Navbar onPartnerLoginClick={() => setCurrentPage('partner')} onNavigate={setCurrentPage} />
            <Home onNavigate={setCurrentPage} />
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
