import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './i18n';
import { initMsg91 } from './msg91Init';   // ADD THIS

initMsg91();                                // ADD THIS — runs once before React renders

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)