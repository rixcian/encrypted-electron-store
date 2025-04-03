import fs from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

import { EncryptedStore } from '../src/main'

// Mock electron modules
vi.mock('electron', () => ({
	app: {
		getPath: () => `${process.cwd()}/test`,
	},
	ipcMain: {
		handle: vi.fn(),
	},
	safeStorage: {
		isEncryptionAvailable: () => true,
		encryptString: (text: string) => Buffer.from(text),
		decryptString: (buffer: Buffer) => buffer.toString(),
	},
}))

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

	it('should be able to delete the store', () => {
		const store = new EncryptedStore({ storeName: 'test', fileExtension: 'json' })
		store.set('test', '🚀')
		store.deleteStore()
		expect(fs.existsSync(`${process.cwd()}/test.json`)).toBe(false)
	})
})
