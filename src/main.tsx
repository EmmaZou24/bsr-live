import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import './components/web/tokens.css'
import scheduleImage from './assets/schedule.png'
import { App } from './App'

const schedulePreload = document.createElement('link')
schedulePreload.rel = 'preload'
schedulePreload.as = 'image'
schedulePreload.href = scheduleImage
document.head.appendChild(schedulePreload)

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
