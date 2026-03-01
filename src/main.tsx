import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { seedDatabase } from './db/seed'
import './index.css'

// Seed default data on first load
seedDatabase().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
