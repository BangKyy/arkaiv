import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
// Self-hosted fonts (PRD section 9): Mozilla Text for headings, Doto for accents,
// Geist Mono for body text. Latin subset only: it covers Indonesian and English.
import '@fontsource/mozilla-text/latin-500.css'
import '@fontsource/mozilla-text/latin-700.css'
import '@fontsource/doto/latin-700.css'
import '@fontsource/doto/latin-900.css'
import '@fontsource/geist-mono/latin-400.css'
import '@fontsource/geist-mono/latin-500.css'
import '@fontsource/geist-mono/latin-600.css'
import '@fontsource/geist-mono/latin-700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
