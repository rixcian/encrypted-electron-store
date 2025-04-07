import { EncryptedStoreProvider } from 'encrypted-electron-store/react'
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<EncryptedStoreProvider defaultStore={{ encrypted: '🔒' }}>
			<App />
		</EncryptedStoreProvider>
	</React.StrictMode>
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
	console.log(message)
})
