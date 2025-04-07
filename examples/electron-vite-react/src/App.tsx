import { useEncryptedStore } from 'encrypted-electron-store/react'
import { useEffect } from 'react'
import EncryptedStoreLogo from './assets/icon.png'

import './App.css'
import Store from './types/store'

function App() {
	const { store, setStore } = useEncryptedStore<Store>()
	const encrypted = useEncryptedStore<Store>((store) => store.encrypted)

	useEffect(() => {
		console.log('store:', store)
	}, [store])

	const updateEncrypted = () => {
		setStore({ encrypted: `${encrypted}🔒` })
	}

	const resetEncrypted = () => {
		setStore({ encrypted: '🔒' })
	}

	return (
		<>
			<div>
				<a href="https://github.com/rixcian/encrypted-electron-store">
					<img src={EncryptedStoreLogo} className="logo" alt="encrypted-electron-store logo" />
				</a>
				<div className="logo-text">
					<h1>encrypted-electron-store</h1>
					<p>
						Click the button to increase the encryption level of the store. Close and re-open the
						app. The encryption level is going to be persisted.
					</p>
				</div>
			</div>
			<div>
				<button onClick={updateEncrypted}>increase encryption</button>
				<button onClick={resetEncrypted} style={{ marginLeft: '12px' }}>
					reset encryption
				</button>
			</div>
			<p>Encryption level: {encrypted}</p>
		</>
	)
}

export default App
