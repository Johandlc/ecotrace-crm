import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig, MotionGlobalConfig } from 'motion/react'
import './index.css'
import App from './App.jsx'
import { StoreProvider } from './store.jsx'

// ?noanim desactiva animaciones (pruebas automatizadas / capturas)
if (new URLSearchParams(window.location.search).has('noanim')) MotionGlobalConfig.skipAnimations = true

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <App />
      </StoreProvider>
    </MotionConfig>
  </StrictMode>,
)
