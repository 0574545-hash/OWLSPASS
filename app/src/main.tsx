import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import './styles/kit.css'
import './styles/app.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    {/* Hash routing: the same build then works from a static host, from a
        shared folder and by double-clicking the standalone file. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
