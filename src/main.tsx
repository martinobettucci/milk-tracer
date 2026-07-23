import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { I18nProvider } from './i18n'
import { ensurePersistentStorage } from './lib/storage'

// Ask the browser to keep our IndexedDB data instead of evicting it.
void ensurePersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
