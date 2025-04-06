import { EVENTS } from './types/events'

export default class EncryptedStore<T extends Record<string, unknown>> {
	private store: T
	private initialized: boolean = false
	private static instance: EncryptedStore<Record<string, unknown>> | null = null

	private constructor() {
		this.store = {} as T
	}

	/**
	 * Create a new instance of EncryptedStore with async initialization.
	 * If an instance already exists, it will be returned instead of creating a new one.
	 * @returns A promise that resolves to an initialized EncryptedStore instance.
	 *
	 * @example
	 * ```ts
	 * const store = await EncryptedStore.create<{ name: string }>()
	 * store.set('name', 'John')
	 * ```
	 */
	public static async create<T extends Record<string, unknown>>(): Promise<EncryptedStore<T>> {
		if (EncryptedStore.instance) {
			return EncryptedStore.instance as EncryptedStore<T>
		}

		const instance = new EncryptedStore<T>()
		await instance.initStore()
		instance.setupEvents()
		instance.initialized = true
		EncryptedStore.instance = instance
		return instance
	}

	/**
	 * Get the singleton instance of EncryptedStore.
	 * Note: This will throw an error if the store hasn't been initialized with create() first.
	 * @returns The singleton instance of EncryptedStore.
	 *
	 * @example
	 * ```ts
	 * // First initialize the store
	 * await EncryptedStore.create<{ name: string }>()
	 *
	 * // Then get the instance anywhere in your code
	 * const store = EncryptedStore.getInstance<{ name: string }>()
	 * ```
	 */
	public static getInstance<T extends Record<string, unknown>>(): EncryptedStore<T> {
		if (!EncryptedStore.instance) {
			throw new Error('Store is not initialized. Make sure to call EncryptedStore.create() first.')
		}
		return EncryptedStore.instance as EncryptedStore<T>
	}

	/**
	 * Reset the singleton instance. This is useful for testing or when you need to completely reset the store.
	 */
	public static resetInstance(): void {
		if (EncryptedStore.instance) {
			EncryptedStore.instance.destroy()
		}
		EncryptedStore.instance = null
	}

	/**
	 * Get a value from the store.
	 * @param key - The key of the value to get.
	 * @returns The value of the key.
	 *
	 * @example
	 * ```ts
	 * const store = await EncryptedStore.create<{ name: string }>()
	 * store.set('name', 'John')
	 * const name = store.get('name') // 'John'
	 * ```
	 */
	public get<K extends keyof T>(key: K): T[K] {
		if (!this.initialized) {
			throw new Error(
				'Store is not initialized. Make sure to use EncryptedStore.create() to initialize the store.'
			)
		}
		return this.store[key]
	}

	/**
	 * Set a value in the store.
	 * @param key - The key of the value to set.
	 * @param value - The value to set.
	 *
	 * @example
	 * ```ts
	 * const store = await EncryptedStore.create<{ name: string }>()
	 * store.set('name', 'John')
	 * ```
	 */
	public set<K extends keyof T>(key: K, value: T[K]): void {
		if (!this.initialized) {
			throw new Error(
				'Store is not initialized. Make sure to use EncryptedStore.create() to initialize the store.'
			)
		}
		this.store[key] = value
		this.saveStore()
	}

	/**
	 * Delete a value from the store.
	 * @param key - The key of the value to delete.
	 *
	 * @example
	 * ```ts
	 * const store = await EncryptedStore.create<{ name: string }>()
	 * store.delete('name')
	 * ```
	 */
	public delete<K extends keyof T>(key: K): void {
		if (!this.initialized) {
			throw new Error(
				'Store is not initialized. Make sure to use EncryptedStore.create() to initialize the store.'
			)
		}
		delete this.store[key]
		this.saveStore()
	}

	/**
	 * Clear the store.
	 *
	 * @example
	 * ```ts
	 * const store = await EncryptedStore.create<{ name: string }>()
	 * store.clear()
	 * ```
	 */
	public clear(): void {
		if (!this.initialized) {
			throw new Error(
				'Store is not initialized. Make sure to use EncryptedStore.create() to initialize the store.'
			)
		}
		this.store = {} as T
		this.saveStore()
	}

	/**
	 * Get the store.
	 * @returns The store.
	 *
	 * @example
	 * ```ts
	 * const store = await EncryptedStore.create<{ name: string }>()
	 * const storeObj = store.getStore()
	 * ```
	 */
	public getStore(): T {
		if (!this.initialized) {
			throw new Error(
				'Store is not initialized. Make sure to use EncryptedStore.create() to initialize the store.'
			)
		}
		return this.store
	}

	/**
	 * Clear the store and delete it from the disk.
	 *
	 * @example
	 * ```ts
	 * const store = await EncryptedStore.create<{ name: string }>()
	 * store.deleteStore()
	 * ```
	 */
	public deleteStore(): void {
		if (!this.initialized) {
			throw new Error(
				'Store is not initialized. Make sure to use EncryptedStore.create() to initialize the store.'
			)
		}
		this.store = {} as T
		this.saveStore()
	}

	/**
	 * Send a request to the main process to save the store to the disk.
	 */
	private saveStore(): void {
		window.encryptedStore.invoke(EVENTS.ENCRYPTED_STORE_SET, this.store)
	}

	/**
	 * Send a request to the main process to get the store and initialize it.
	 */
	private async initStore(): Promise<void> {
		// Check if the window.encryptedStore is available
		if (!window.encryptedStore) {
			throw new Error(
				'window.encryptedStore is not available. Please check if you called preloadEncryptedStore() (imported from "electron-encrypted-store/preload") in your preload file.'
			)
		}

		try {
			const store = await window.encryptedStore.invoke(EVENTS.ENCRYPTED_STORE_GET)
			this.store = store as T
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	private updateStore(store: Partial<T>): void {
		this.store = { ...this.store, ...store }
	}

	/**
	 * Setup the listening event for the store changes from the main process.
	 */
	private setupEvents(): void {
		if (!window.encryptedStore) {
			throw new Error(
				'window.encryptedStore is not available. Please check if you called preloadEncryptedStore() (imported from "electron-encrypted-store/preload") in your preload file.'
			)
		}

		window.encryptedStore.on(
			EVENTS.ENCRYPTED_STORE_UPDATED,
			this.updateStore as (...args: unknown[]) => void
		)
	}

	/**
	 * Destroy the store and remove the listening event.
	 *
	 * @example
	 * ```ts
	 * const store = await EncryptedStore.create<{ name: string }>()
	 *
	 * // Should be called when the component unmounts.
	 * store.destroy()
	 * ```
	 */
	public destroy(): void {
		if (!this.initialized) {
			throw new Error(
				'Store is not initialized. Make sure to use EncryptedStore.create() to initialize the store.'
			)
		}
		window.encryptedStore.off(
			EVENTS.ENCRYPTED_STORE_UPDATED,
			this.updateStore as (...args: unknown[]) => void
		)
	}
}
