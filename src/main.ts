import type { BrowserWindow } from 'electron'
import { app, ipcMain, safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

import { EVENTS } from './types/events'

const DEFAULT_STORE_NAME = 'store'
const DEFAULT_FILE_EXTENSION = 'json'

interface Options<T extends Record<string, unknown>> {
	/**
	 * The name of the file to store the data..
	 * @default 'store'
	 */
	storeName?: string

	/**
	 * The file extension of the file to store the data.
	 * @default 'json'
	 */
	fileExtension?: string

	/**
	 * Browser window of the renderer process.
	 *
	 * This has to be set if you want to use the store in the renderer process.
	 * @default undefined
	 */
	browserWindow?: BrowserWindow

	/**
	 * The default value of the store.
	 *
	 * Note: This will be used if the store file does not exist.
	 * @default {}
	 */
	defaults?: T
}

/**
 * A class for storing and retrieving encrypted data.
 *
 * @example
 * ```ts
 * // Main process
 * import EncryptedStore from 'encrypted-electron-store/main'
 * const store = EncryptedStore.create()
 *
 * store.set('name', 'John')
 * console.log(store.get('name'))
 *
 * // If you want to use the store in the renderer process:
 *
 * // Preload file
 * import { preloadEncryptedStore } from 'electron-encrypted-store/preload'
 *
 * preloadEncryptedStore()
 *
 * // Renderer process
 * import { useEncryptedStore } from 'electron-encrypted-store/renderer'
 *
 * const store = useEncryptedStore()
 * ```
 */
class EncryptedStore<T> {
	private static stores: Record<string, EncryptedStore<any>> = {}
	private store: Record<keyof T, T[keyof T]>
	private browserWindow: BrowserWindow | undefined
	readonly path: string
	readonly defaults: Record<keyof T, T[keyof T]>

	private constructor(initialOptions: Readonly<Partial<Options<Record<string, unknown>>>> = {}) {
		const defaultOptions: Options<Record<string, unknown>> = {
			storeName: DEFAULT_STORE_NAME,
			fileExtension: DEFAULT_FILE_EXTENSION,
			browserWindow: undefined,
			defaults: {} as Record<keyof T, T[keyof T]>,
			...initialOptions,
		}

		this.store = {} as T
		// Create a deep copy of the defaults
		this.defaults = JSON.parse(JSON.stringify(defaultOptions.defaults || {}))
		this.browserWindow = defaultOptions.browserWindow
		this.path = path.join(
			app.getPath('userData'),
			`${defaultOptions.storeName}.${defaultOptions.fileExtension}`
		)

		// Initialize the store from the file.
		this.initStore()

		// Setup the events.
		this.setupEvents()
	}

	/**
	 * Create a new store instance.
	 *
	 * @param initialOptions - The options for the store.
	 * @returns The store instance.
	 */
	public static create<T>(
		initialOptions: Readonly<Partial<Options<Record<string, unknown>>>> = {}
	): EncryptedStore<T> {
		const storeName = initialOptions.storeName || DEFAULT_STORE_NAME
		if (!EncryptedStore.stores[storeName]) {
			EncryptedStore.stores[storeName] = new EncryptedStore(initialOptions)
		}
		return EncryptedStore.stores[storeName]
	}

	/**
	 * Initialize the store from the file.
	 */
	private initStore() {
		// If encryption on the device is not available, warn the user.
		if (!safeStorage.isEncryptionAvailable()) {
			console.warn(
				'[encrypted-electron-store] Encryption is not available. Data will be encrypted via hardcoded plaintext password.'
			)
		}

		// If the store file already exists, decrypt it and parse it.
		if (fs.existsSync(this.path)) {
			try {
				const encryptedStore = Buffer.from(fs.readFileSync(this.path, 'utf-8'), 'base64')
				const decryptedStore = safeStorage.decryptString(encryptedStore)

				this.store = JSON.parse(decryptedStore)
				this.saveStore()
			} catch (error) {
				console.error(error)

				// Set store to the deep copy of the defaults
				this.store = JSON.parse(JSON.stringify(this.defaults || {}))
				this.saveStore()
			}
		} else {
			// If the store file does not exist, use the deep copy of the defaults.
			this.store = JSON.parse(JSON.stringify(this.defaults || {}))
			this.saveStore()
		}
	}

	private setupEvents() {
		ipcMain.handle(
			EVENTS.ENCRYPTED_STORE_GET,
			(_, defaultStore?: T) =>
				new Promise((resolve) => {
					// If the store is empty, return the default store.
					if (Object.keys(this.store as Record<string, unknown>).length === 0) {
						this.store = JSON.parse(JSON.stringify(defaultStore || {}))
						this.saveStore()
					}

					resolve(this.store)
				})
		)

		ipcMain.handle(
			EVENTS.ENCRYPTED_STORE_SET,
			(_, store: T) =>
				new Promise((resolve) => {
					this.store = store
					this.saveStore()
					resolve(true)
				})
		)
	}

	public setBrowserWindow(browserWindow: BrowserWindow) {
		this.browserWindow = browserWindow
	}

	/**
	 * Encrypt and save the store to the file.
	 */
	private saveStore() {
		const encryptedStore = safeStorage
			.encryptString(JSON.stringify(this.store, null, 0))
			.toString('base64')
		fs.writeFileSync(this.path, encryptedStore)
	}

	/**
	 * Get a value from the store.
	 *
	 * @param key - The key of the value to get.
	 * @param defaultValue - The default value to set if the key doesn't have a value.
	 * @returns The value of the key.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * const name = store.get('name')
	 * const age = store.get('age', 20)
	 * ```
	 */
	public get<K extends keyof T>(key: K, defaultValue?: unknown): T[K] {
		if (!defaultValue) {
			return this.store[key] as T[K]
		} else {
			// If the key doesn't have value (is undefined), set the defaultValue
			if (this.store[key] === undefined) {
				this.store[key] = defaultValue as T[K]
				this.saveStore()
			}

			return this.store[key] as T[K]
		}
	}

	/**
	 * Set a value in the store.
	 *
	 * @param key - The key of the value to set.
	 * @param value - The value to set.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * store.set('name', 'John')
	 * ```
	 */
	public set<K extends keyof T>(key: K, value: T[K]): void

	/**
	 * Set multiple values in the store.
	 *
	 * @param values - The values to set in the store.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * store.set({ name: 'John', age: 20 })
	 * ```
	 */
	public set(values: Partial<T>): void

	public set<K extends keyof T>(keyOrValues: K | Partial<T>, value?: T[K]): void {
		if (value !== undefined) {
			// Single key-value pair case
			const key = keyOrValues as K
			this.store[key] = value
		} else {
			// Multiple values case
			const values = keyOrValues as Partial<T>
			Object.assign(this.store as Record<string, unknown>, values)
		}

		this.saveStore()

		// Send the updated store to the renderer process.
		if (this.browserWindow) {
			this.browserWindow.webContents.send(EVENTS.ENCRYPTED_STORE_UPDATED, this.store)
		}
	}

	/**
	 * Delete a key value pair from the store.
	 *
	 * @param key - The key of the value to delete.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * store.delete('name')
	 * ```
	 */
	public delete<K extends keyof T>(key: K): void {
		// Delete the key value pair from the object and save the store to disk.
		delete this.store[key]
		this.saveStore()

		// Send the updated store to the renderer process.
		this.browserWindow?.webContents.send(EVENTS.ENCRYPTED_STORE_UPDATED, this.store)
	}

	/**
	 * Check if a key exists in the store.
	 *
	 * @param key - The key to check.
	 * @returns `true` if the key exists, `false` otherwise.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * store.has('name') // false
	 * store.set('name', 'John')
	 * store.has('name') // true
	 * ```
	 */
	public has(key: keyof T): boolean {
		return this.store[key] !== undefined
	}

	/**
	 * Get the size of the store.
	 *
	 * @returns The size of the store.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * store.size() // 0
	 * store.set('name', 'John')
	 * store.size() // 1
	 * ```
	 */
	public size(): number {
		return Object.keys(this.store as Record<string, unknown>).length
	}

	/**
	 * Clear the store.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * store.clear()
	 * ```
	 */
	public clear(): void {
		// Clear the store object and save it to disk.
		this.store = {} as T
		this.saveStore()

		// Send the updated store to the renderer process.
		this.browserWindow?.webContents.send(EVENTS.ENCRYPTED_STORE_UPDATED, this.store)
	}

	/**
	 * Reset the store to the defaults.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * store.reset()
	 * ```
	 */
	public reset(): void {
		// Create a deep copy of the defaults object
		this.store = JSON.parse(JSON.stringify(this.defaults || {}))
		this.saveStore()

		// Send the updated store to the renderer process.
		this.browserWindow?.webContents.send(EVENTS.ENCRYPTED_STORE_UPDATED, this.store)
	}

	/**
	 * Get the store as an object.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * const storeObject = store.getStore()
	 * ```
	 */
	public getStore(): T {
		return this.store as T
	}

	/**
	 * Delete the store file from disk.
	 *
	 * @example
	 * ```ts
	 * const store = new EncryptedStore()
	 * store.deleteStore()
	 * ```
	 */
	public deleteStore(): void {
		this.store = {} as T
		fs.unlinkSync(this.path)
	}
}

export default EncryptedStore
