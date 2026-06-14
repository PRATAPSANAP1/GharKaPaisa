import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import PartnerPanel from './components/PartnerPanel';
import { ThemeProvider } from './components/Partner/ThemeContext';

import Home from './components/Home';

function App() {
  const [showPartnerPanel, setShowPartnerPanel] = useState(false);

  return (
    <ThemeProvider>
      <div className="App">
        {showPartnerPanel ? (
          <PartnerPanel onBackToMain={() => setShowPartnerPanel(false)} />
        ) : (
          <>
            <Navbar onPartnerLoginClick={() => setShowPartnerPanel(true)} />
            <Home />
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
