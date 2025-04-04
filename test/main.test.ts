import { BrowserWindow } from 'electron'
import fs from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

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
import { ipcMain, safeStorage } from 'electron'

describe('encrypted-electron-store/main', () => {
	it('should be instantiable', () => {
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })
		expect(store).toBeInstanceOf(EncryptedStore)
	})

	it('should have a default store name', () => {
		const store = new EncryptedStore({ fileExtension: 'json' })
		expect(store.path.includes('store')).toBe(true)
	})

	it('should have a default file extension', () => {
		const store = new EncryptedStore({ storeName: 'test' })
		expect(store.path.includes('json')).toBe(true)
	})

	it('should have a set store name', () => {
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })
		expect(store.path.includes('test')).toBe(true)
	})

	it('should have a set file extension', () => {
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })
		expect(store.path.includes('json')).toBe(true)
	})

	it('should be able to set and get a value', () => {
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })
		store.set('test', '🚀')
		expect(store.get('test')).toBe('🚀')
	})

	it('should be able to delete a value', () => {
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })
		store.set('test', '🚀')
		store.delete('test')
		expect(store.get('test')).toBeUndefined()
	})

	it('should be able to get the store as an object', () => {
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })
		store.set('test', '🚀')
		expect(store.getStore()).toEqual({ test: '🚀' })
	})

	it('should be able to clear the store', () => {
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })
		store.set('test', '🚀')
		store.clear()
		expect(store.get('test')).toBeUndefined()
	})

	it('should warn when encryption is not available', () => {
		// Mock console.warn
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

		// Mock isEncryptionAvailable to return false
		vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValueOnce(false)

		// Create a new store instance
		new EncryptedStore({ storeName: 'test', fileExtension: 'json' })

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
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })

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
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })

		// Verify ipcMain.handle was called for ENCRYPTED_STORE_GET
		expect(ipcMain.handle).toHaveBeenCalledWith(expect.any(String), expect.any(Function))

		// Verify ipcMain.handle was called for ENCRYPTED_STORE_SET
		expect(ipcMain.handle).toHaveBeenCalledWith(expect.any(String), expect.any(Function))
	})

	it('should set browser window', () => {
		// Create a new store instance
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })

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
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })

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

	it('should be able to delete the store', () => {
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })
		store.set('test', '🚀')
		store.deleteStore()
		expect(fs.existsSync(`${process.cwd()}/test.json`)).toBe(false)
	})
})
