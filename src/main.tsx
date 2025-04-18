import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

/**
 * Entry point for the application
 * - Uses React 18's createRoot API
 * - Enables Strict Mode for development checks
 * - Renders the App component
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
