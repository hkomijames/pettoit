import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga4'
import './index.css'
import App from './App.jsx'

// Just initialize it here once
ReactGA.initialize("G-Y9PGXPPW81"); 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
