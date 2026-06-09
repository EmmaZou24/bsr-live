import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import { InteractiveIcon } from './components/InteractiveIcon'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <InteractiveIcon />
  </StrictMode>,
)
