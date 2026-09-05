import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // strict mode just adds extra checks for our devleopment, keep for right now for testintg.
  <StrictMode>
    <App />
  </StrictMode>,
)
