import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { EVENTS } from './types/events'

// Define the context type
interface EncryptedStoreContextType<T extends Record<string, unknown>> {
	store: T
	setStore: (store: T) => void
}

// Create the context with a default value
const EncryptedStoreContext = createContext<
	EncryptedStoreContextType<Record<string, unknown>> | undefined
>(undefined)

// Create a provider component
export function EncryptedStoreProvider<T extends Record<string, unknown>>({
	children,
}: {
	children: ReactNode
}) {
	const [store, setStore] = useState<T>({} as T)

	// Get the initial store from the main process and listen for updates
	useEffect(() => {
		// Check if the window.encryptedStore is available
		if (!window.encryptedStore) {
			throw new Error(
				'window.encryptedStore is not available. Please check if you called preloadEncryptedStore() (imported from "electron-encrypted-store/preload") in your preload file.'
			)
		}

		// Get the initial store from the main process
		window.encryptedStore
			.invoke(EVENTS.ENCRYPTED_STORE_GET)
			.then((initialStore: unknown) => {
				if (initialStore && typeof initialStore === 'object') {
					setStore(initialStore as T)
				} else {
					console.error('[encrypted-electron-store/react] Initial store is not an object')
				}
			})
			.catch((error: Error) => {
				console.error('[encrypted-electron-store/react] Error getting initial store:', error)
			})

		// Listen for updates from the main process
		const updateStore = (_: unknown, store: T) => setStore(store)
		window.encryptedStore.on(
			EVENTS.ENCRYPTED_STORE_UPDATED,
			updateStore as (...args: unknown[]) => void
		)

		// Clean up the listener when the component unmounts
		return () => {
			window.encryptedStore.off(
				EVENTS.ENCRYPTED_STORE_UPDATED,
				updateStore as (...args: unknown[]) => void
			)
		}
	}, [])

	// Set the store in the main process
	const _setStore = (store: T) => {
		window.encryptedStore.invoke(EVENTS.ENCRYPTED_STORE_SET, store)
		setStore(store)
	}

	return (
		<EncryptedStoreContext.Provider
			value={{ store, setStore: _setStore } as EncryptedStoreContextType<Record<string, unknown>>}
		>
			{children}
		</EncryptedStoreContext.Provider>
	)
}

// Create a custom hook to use the theme context
export const useEncryptedStore: <
	T extends Record<string, unknown>,
>() => EncryptedStoreContextType<T> = <T extends Record<string, unknown>>() => {
	const context = useContext(EncryptedStoreContext)
	if (context === undefined) {
		throw new Error('useEncryptedStore must be used within a EncryptedStoreProvider')
	}

	return context as EncryptedStoreContextType<T>
}
