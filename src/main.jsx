import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/lib/i18n'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Optionally: show a prompt to the user to reload the page
  },
  onOfflineReady() {
    // Optionally: show a message that the app is ready for offline use
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
