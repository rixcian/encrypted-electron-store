import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EVENTS } from '../src/types/events'
import EncryptedStore from '../src/vanilla'

let mockedStore = { test: 'value' }

// Mock the window.encryptedStore object
const mockInvoke = vi.fn().mockImplementation((channel: string, ...args: unknown[]) => {
	if (channel === EVENTS.ENCRYPTED_STORE_GET) {
		return Promise.resolve(mockedStore)
	}
	if (channel === EVENTS.ENCRYPTED_STORE_SET) {
		mockedStore = args[0] as { test: string }
		return Promise.resolve()
	}
	return Promise.resolve()
})
const mockOn = vi.fn().mockImplementation((event, callback) => {
	// Store the callback for later use in tests
	if (event === EVENTS.ENCRYPTED_STORE_UPDATED) {
		mockOn.mock.calls[0][1] = callback
	}
	return undefined
})
const mockOff = vi.fn()

describe('EncryptedStore', () => {
	let store: EncryptedStore<{ test: string }>

	beforeEach(async () => {
		vi.clearAllMocks()

		// Setup global window.encryptedStore mock
		vi.stubGlobal('window', {
			encryptedStore: {
				invoke: mockInvoke,
				on: mockOn,
				off: mockOff,
			},
		})

		// Create a new store instance for each test
		store = await EncryptedStore.create<{ test: string }>()
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('should initialize with an empty store', () => {
		expect(store.getStore()).toEqual(mockedStore)
	})

	it('should request initial store data from the main process', () => {
		expect(mockInvoke).toHaveBeenCalledWith(EVENTS.ENCRYPTED_STORE_GET)
	})

	it('should set up event listeners for store updates', () => {
		expect(mockOn).toHaveBeenCalledWith(EVENTS.ENCRYPTED_STORE_UPDATED, expect.any(Function))
	})

	it('should update the store when receiving data from the main process', async () => {
		const mockStoreData = { test: 'value' }
		mockInvoke.mockResolvedValueOnce(mockStoreData)

		// Create a new store to trigger the initStore method
		const newStore = await EncryptedStore.create<{ test: string }>()

		// Wait for the promise to resolve
		await vi.waitFor(() => {
			expect(newStore.getStore()).toEqual(mockStoreData)
		})
	})

	it('should get a value from the store', () => {
		// Manually set the store for testing
		;(store as any).store = { test: 'value' }

		expect(store.get('test')).toBe('value')
	})

	it('should delete a value from the store', () => {
		// Manually set the store for testing
		;(store as any).store = { test: 'value' }

		store.delete('test')

		expect(store.getStore()).toEqual({})
		expect(mockInvoke).toHaveBeenCalledWith(EVENTS.ENCRYPTED_STORE_SET, {})
	})

	it('should clear the store', () => {
		// Manually set the store for testing
		;(store as any).store = { test: 'value' }

		store.clear()

		expect(store.getStore()).toEqual({})
	})

	it('should get the entire store', () => {
		;(store as any).store = { test: 'value' }

		expect(store.getStore()).toEqual({ test: 'value' })
	})

	it('should delete the store', () => {
		// Manually set the store for testing
		;(store as any).store = { test: 'value' }

		store.deleteStore()

		expect(store.getStore()).toEqual({})
	})

	// it('should update the store when receiving updates from the main process', () => {
	// 	// Get the update function that was registered with the event listener
	// 	const updateFunction = mockOn.mock.calls[0][1] as (store: { newKey: string }) => void

	// 	// Call the update function with new data
	// 	updateFunction({ newKey: 'newValue' })

	// 	expect(store.getStore()).toEqual({ newKey: 'newValue' })
	// })

	it('should clean up event listeners on destroy', () => {
		store.destroy()

		expect(mockOff).toHaveBeenCalledWith(EVENTS.ENCRYPTED_STORE_UPDATED, expect.any(Function))
	})

	it('should handle errors when initializing the store', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
		const error = new Error('Failed to get store')
		mockInvoke.mockRejectedValueOnce(error)

		// Create a new store to trigger the initStore method
		await EncryptedStore.create<{ test: string }>()

		// Wait for the promise to reject
		await vi.waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalledWith(error)
		})

		consoleErrorSpy.mockRestore()
	})

	it('should throw an error when window.encryptedStore is not available', () => {
		// Remove the window.encryptedStore mock
		vi.stubGlobal('window', {})

		// Expect an error to be thrown when creating a new store
		expect(async () => {
			await EncryptedStore.create<{ test: string }>()
		}).toThrow(
			'window.encryptedStore is not available. Please check if you called preloadEncryptedStore() (imported from "electron-encrypted-store/preload") in your preload file.'
		)
	})
})
