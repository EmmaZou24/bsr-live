import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import './components/web/tokens.css'
import { MainPage } from './pages'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <MainPage />
  </StrictMode>,
)
