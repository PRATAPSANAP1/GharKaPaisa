import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './i18n';
import { preloadMsg91SDK } from './msg91Init';

// Load MSG91 SDK script once at app startup (no container needed yet)
preloadMsg91SDK();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)