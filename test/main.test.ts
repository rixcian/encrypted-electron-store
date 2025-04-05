import { BrowserWindow, ipcMain, safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import EncryptedStore from '../src/main'

// Mock electron modules
vi.mock('electron', () => ({
	app: {
		getPath: () => `${process.cwd()}/test`,
	},
	ipcMain: {
		handle: vi.fn(),
	},
	safeStorage: {
		isEncryptionAvailable: vi.fn(() => true),
		encryptString: (text: string) => Buffer.from(text),
		decryptString: (buffer: Buffer) => buffer.toString(),
	},
}))

// Import the mocked electron modules

describe('encrypted-electron-store/main', () => {
	// Helper function to generate unique store names,
	// because "vitest" is running tests in parallel,
	// so tests would use the same file in the same time and that would cause errors
	const getUniqueStoreName = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}`

	// Clean up after each test
	afterEach(() => {
		// Clean up any test .json files that might have been created
		const testDir = path.join(process.cwd(), 'test')
		const testFiles = fs.readdirSync(testDir)
		testFiles.forEach((file) => {
			if (file.endsWith('.json') || file.endsWith('.txt')) {
				fs.unlinkSync(path.join(testDir, file))
			}
		})
	})

	it('should be instantiable', () => {
		// Create a new store instance with unique name
		const store = new EncryptedStore()

		// Verify the store is an instance of EncryptedStore
		expect(store).toBeInstanceOf(EncryptedStore)
	})

	it('should have a default store name', () => {
		// Create a new store instance
		const store = new EncryptedStore({ fileExtension: 'json' })

		// Get the path to the store file
		const storePath = path.join(process.cwd(), 'test', `store.json`)

		// Verify the store name is set
		expect(fs.existsSync(storePath)).toBe(true)
	})

	it('should have a default file extension', () => {
		// Generate a unique store name
		const storeName = getUniqueStoreName()

		// Create a new store instance
		const store = new EncryptedStore({ storeName })

		// Get the path to the store file
		const storePath = path.join(process.cwd(), 'test', `${storeName}.json`)

		// Verify the store name is set
		expect(fs.existsSync(storePath)).toBe(true)
	})

	it('should have a set store name', () => {
		// Generate a unique store name
		const storeName = getUniqueStoreName()

		// Create a new store instance
		const store = new EncryptedStore({ storeName })

		// Get the path to the store file
		const storePath = path.join(process.cwd(), 'test', `${storeName}.json`)

		// Verify the store name is set
		expect(fs.existsSync(storePath)).toBe(true)
	})

	it('should have a set file extension', () => {
		// Generate a unique store name
		const storeName = getUniqueStoreName()

		// Create a new store instance
		const store = new EncryptedStore({ storeName, fileExtension: 'txt' })

		// Get the path to the store file
		const storePath = path.join(process.cwd(), 'test', `${storeName}.txt`)

		// Verify the file extension is set
		expect(fs.existsSync(storePath)).toBe(true)
	})

	it('should be able to set and get a single value', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Set a value
		store.set('test', '🚀')

		// Verify the value is set
		expect(store.get('test')).toBe('🚀')
	})

	it('should be able to get a single value with a defaultValue set', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Get a value with a defaultValue set
		expect(store.get('test', 'defaultValue')).toBe('defaultValue')
	})

	it('should be able to set multiple values', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Set multiple values
		store.set({ test: '🚀', nested: { key: 'value' } })

		// Verify the values are set
		expect(store.get('test')).toBe('🚀')
		expect(store.get('nested')).toEqual({ key: 'value' })
	})

	it('should be able to delete a value', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Set a value
		store.set('test', '🚀')

		// Delete the value
		store.delete('test')

		// Verify the value is undefined
		expect(store.get('test')).toBeUndefined()
	})

	it('should be able to check if a key exists', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Set a value
		store.set('test', '🚀')

		// Verify the key exists
		expect(store.has('test')).toBe(true)

		// Delete the value
		store.delete('test')

		// Verify the key doesn't exist
		expect(store.has('test')).toBe(false)
	})

	it('should be able to get the size of the store', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Verify the size is 0
		expect(store.size()).toBe(0)

		// Set a value
		store.set('test', '🚀')

		// Verify the size is 1
		expect(store.size()).toBe(1)

		// Remove the value
		store.delete('test')

		// Verify the size is 0
		expect(store.size()).toBe(0)
	})

	it('should be able to get the store as an object', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Set a value
		store.set('test', '🚀')

		// Verify the store is an object
		expect(store.getStore()).toEqual({ test: '🚀' })
	})

	it('should be able to clear the store', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Set a value
		store.set('test', '🚀')

		// Clear the store
		store.clear()

		// Verify the value is undefined
		expect(store.get('test')).toBeUndefined()
		expect(store.getStore()).toEqual({})
	})

	it('should warn when encryption is not available', () => {
		// Mock console.warn
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

		// Mock isEncryptionAvailable to return false
		vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValueOnce(false)

		// Create a new store instance
		new EncryptedStore({ storeName: getUniqueStoreName() })

		// Verify warning was logged
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'[encrypted-electron-store] Encryption is not available. Data will be encrypted via hardcoded plaintext password.'
		)

		// Restore console.warn
		consoleWarnSpy.mockRestore()
	})

	it('should handle errors when reading the store file', () => {
		// Mock fs.existsSync to return true
		vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true)

		// Mock fs.readFileSync to throw an error
		vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
			throw new Error('Test error')
		})

		// Mock console.error
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Verify error was logged
		expect(consoleErrorSpy).toHaveBeenCalled()

		// Verify store is initialized as empty object
		expect(store.getStore()).toEqual({})

		// Restore mocks
		consoleErrorSpy.mockRestore()
		vi.restoreAllMocks()
	})

	it('should set up IPC events', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Verify ipcMain.handle was called for ENCRYPTED_STORE_GET
		expect(ipcMain.handle).toHaveBeenCalledWith(expect.any(String), expect.any(Function))

		// Verify ipcMain.handle was called for ENCRYPTED_STORE_SET
		expect(ipcMain.handle).toHaveBeenCalledWith(expect.any(String), expect.any(Function))
	})

	it('should set browser window', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Create a mock browser window
		const mockBrowserWindow = {
			webContents: {
				send: vi.fn(),
			},
		} as unknown as BrowserWindow

		// Set the browser window
		store.setBrowserWindow(mockBrowserWindow)

		// Verify the browser window was set
		// Note: We can't directly access the private property, but we can test the behavior
		// by setting a value and checking if the webContents.send was called
		store.set('test', '🚀')

		// Verify webContents.send was called
		expect(mockBrowserWindow.webContents.send).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ test: '🚀' })
		)
	})

	it('should send updates to the browser window when setting values', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: getUniqueStoreName() })

		// Create a mock browser window
		const mockBrowserWindow = {
			webContents: {
				send: vi.fn(),
			},
		} as unknown as BrowserWindow

		// Set the browser window
		store.setBrowserWindow(mockBrowserWindow)

		// Set a value
		store.set('test', '🚀')

		// Verify webContents.send was called
		expect(mockBrowserWindow.webContents.send).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ test: '🚀' })
		)
	})

	it('should initialize with defaults when provided', () => {
		const defaults = { defaultKey: 'defaultValue', nested: { key: 'value' } }
		const store = new EncryptedStore({
			storeName: getUniqueStoreName(),
			fileExtension: 'json',
			defaults,
		})

		// Check that the store is initialized with the defaults
		expect(store.getStore()).toEqual(defaults)

		// Check that we can access the default values
		expect(store.get('defaultKey')).toBe('defaultValue')
		expect(store.get('nested')).toEqual({ key: 'value' })
	})

	it('should reset to defaults when reset is called', () => {
		const defaults = { defaultKey: 'defaultValue', nested: { key: 'value' } }
		const store = new EncryptedStore({
			storeName: getUniqueStoreName(),
			fileExtension: 'json',
			defaults,
		})

		// Modify the store
		store.set('defaultKey', 'modifiedValue')

		// Reset the store
		store.reset()

		// Check that the store is reset to defaults
		expect(store.getStore()).toEqual(defaults)
		expect(store.get('defaultKey')).toBe('defaultValue')
	})

	it('should send updates to the browser window when reset is called', () => {
		const defaults = { defaultKey: 'defaultValue' }
		const store = new EncryptedStore({
			storeName: getUniqueStoreName(),
			defaults,
		})

		// Create a mock browser window
		const mockBrowserWindow = {
			webContents: {
				send: vi.fn(),
			},
		} as unknown as BrowserWindow

		// Set the browser window
		store.setBrowserWindow(mockBrowserWindow)

		// Modify the store
		store.set('defaultKey', 'modifiedValue')

		// Reset the store
		store.reset()

		// Verify webContents.send was called with the reset store
		expect(mockBrowserWindow.webContents.send).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining(defaults)
		)
	})

	it('should be able to delete the store', () => {
		// Generate a unique store name
		const storeName = getUniqueStoreName()

		// Create a new store instance
		const store = new EncryptedStore({ storeName, fileExtension: 'json' })

		// Set a value
		store.set('test', '🚀')

		// Delete the store
		store.deleteStore()

		// Get the path to the store file
		const storePath = path.join(process.cwd(), 'test', `${storeName}.json`)

		// Verify the store file was deleted
		expect(fs.existsSync(storePath)).toBe(false)
	})
})
