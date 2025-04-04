import type { BrowserWindow } from 'electron'
import { app, ipcMain, safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

import { EVENTS } from './types/events'

interface Options {
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
}

/**
 * A class for storing and retrieving encrypted data.
 *
 * @example
 * ```ts
 * // Main process
 * const store = new EncryptedStore()
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
class EncryptedStore<T extends Record<string, unknown>> {
	private store: T
	private browserWindow: BrowserWindow | undefined
	readonly path: string

	constructor(initialOptions: Readonly<Partial<Options>> = {}) {
		const defaultOptions: Options = {
			storeName: 'store',
			fileExtension: 'json',
			browserWindow: undefined,
			...initialOptions,
		}

		this.store = {} as T
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
				const encryptedStore = Buffer.from(fs.readFileSync(this.path, 'base64'), 'base64')
				const decryptedStore = safeStorage.decryptString(encryptedStore)

				this.store = JSON.parse(decryptedStore)
			} catch (error) {
				console.error(error)

				this.store = {} as T
			}
		} else {
			// If the store file does not exist, create an empty store.
			this.store = {} as T
		}
	}

	private setupEvents() {
		ipcMain.handle(EVENTS.ENCRYPTED_STORE_GET, () => new Promise((resolve) => resolve(this.store)))

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
		fs.writeFileSync(this.path, encryptedStore, 'base64')
	}

	/**
	 * Get a value from the store.
	 */
	public get<K extends keyof T>(key: K): T[K] {
		return this.store[key]
	}

	/**
	 * Set a value in the store.
	 */
	public set<K extends keyof T>(key: K, value: T[K]): void {
		// Set the value in the object and save the store to disk.
		this.store[key] = value
		this.saveStore()

		// Send the updated store to the renderer process.
		if (this.browserWindow) {
			this.browserWindow.webContents.send(EVENTS.ENCRYPTED_STORE_UPDATED, this.store)
		}
	}

	/**
	 * Delete a key value pair from the store.
	 */
	public delete<K extends keyof T>(key: K): void {
		// Delete the key value pair from the object and save the store to disk.
		delete this.store[key]
		this.saveStore()

		// Send the updated store to the renderer process.
		this.browserWindow?.webContents.send(EVENTS.ENCRYPTED_STORE_UPDATED, this.store)
	}

	/**
	 * Clear the store.
	 */
	public clear(): void {
		// Clear the store object and save it to disk.
		this.store = {} as T
		this.saveStore()

		// Send the updated store to the renderer process.
		this.browserWindow?.webContents.send(EVENTS.ENCRYPTED_STORE_UPDATED, this.store)
	}

	/**
	 * Get the store as an object.
	 */
	public getStore(): T {
		return this.store
	}

	/**
	 * Delete the store file from disk.
	 */
	public deleteStore(): void {
		this.store = {} as T
		fs.unlinkSync(this.path)
	}
}

export default EncryptedStore
