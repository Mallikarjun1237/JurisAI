import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Enforce dark mode permanently across the entire application
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark')
  document.body.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
