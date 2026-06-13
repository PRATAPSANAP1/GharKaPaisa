import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import AgentPanel from './components/AgentPanel';
import { ThemeProvider } from './components/Agent/ThemeContext';

function App() {
  const [showAgentPanel, setShowAgentPanel] = useState(false);

  return (
    <ThemeProvider>
      <div className="App">
        {showAgentPanel ? (
          <AgentPanel onBackToMain={() => setShowAgentPanel(false)} />
        ) : (
          <Navbar onAgentLoginClick={() => setShowAgentPanel(true)} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
