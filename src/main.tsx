import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import './components/web/tokens.css'
import { App } from './App'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
