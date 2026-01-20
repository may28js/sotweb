import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadAppConfig } from './lib/api'

loadAppConfig().then(() => {
    createRoot(document.getElementById('root')!).render(
        <App />
    )
});
