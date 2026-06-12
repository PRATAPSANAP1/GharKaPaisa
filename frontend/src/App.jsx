import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import AgentPanel from './components/AgentPanel';

function App() {
  const [showAgentPanel, setShowAgentPanel] = useState(false);

  return (
    <div className="App">
      {showAgentPanel ? (
        <AgentPanel onBackToMain={() => setShowAgentPanel(false)} />
      ) : (
        <Navbar onAgentLoginClick={() => setShowAgentPanel(true)} />
      )}
    </div>
  );
}

export default App;
