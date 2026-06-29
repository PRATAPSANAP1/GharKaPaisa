import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import './app/i18n';
import { preloadMsg91SDK } from './app/msg91Init';

// Load MSG91 SDK script once at app startup (no container needed yet)
preloadMsg91SDK();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)