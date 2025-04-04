import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { EVENTS } from './types/events'

// Define the context type
interface EncryptedStoreContextType<T extends Record<string, unknown>> {
	store: T
	setStore: (store: Partial<T>) => void
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
		const updateStore = (_: unknown, store: Partial<T>) =>
			setStore((prev) => ({ ...prev, ...store }))
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
	const _setStore = (store: Partial<T>) => {
		window.encryptedStore.invoke(EVENTS.ENCRYPTED_STORE_SET, store)
		setStore((prev) => ({ ...prev, ...store }))
	}

	return (
		<EncryptedStoreContext.Provider
			value={{ store, setStore: _setStore } as EncryptedStoreContextType<Record<string, unknown>>}
		>
			{children}
		</EncryptedStoreContext.Provider>
	)
}

// Helper type for the selector function
export type EncryptedStoreSelector<T extends Record<string, unknown>, R> = (
	store: T,
	setStore: (store: T) => void
) => R

// Create a custom hook to use the encrypted store
export function useEncryptedStore<
	T extends Record<string, unknown>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	R = EncryptedStoreContextType<T> | any,
>(selector?: EncryptedStoreSelector<T, R>): R {
	const context = useContext(EncryptedStoreContext)

	if (context === undefined) {
		throw new Error('useEncryptedStore must be used within a EncryptedStoreProvider')
	}

	// If a selector is provided, use it to extract the value
	if (selector) {
		return selector(context.store as T, context.setStore as (store: T) => void)
	}

	// Otherwise, return the full context
	return context as unknown as R
}
