import { beforeEach, describe, expect, it, vi } from 'vitest'
import { preloadEncryptedStore } from '../src/preload'

// Mock the electron module
vi.mock('electron', () => {
	return {
		contextBridge: {
			exposeInMainWorld: vi.fn(),
		},
		ipcRenderer: {
			on: vi.fn(),
			off: vi.fn(),
			send: vi.fn(),
			invoke: vi.fn(),
		},
	}
})

// Import the mocked module
import { contextBridge, ipcRenderer } from 'electron'

describe('preloadEncryptedStore', () => {
	let exposedAPI: any

	beforeEach(() => {
		vi.clearAllMocks()
		// Capture the exposed API when contextBridge.exposeInMainWorld is called
		vi.mocked(contextBridge.exposeInMainWorld).mockImplementation((_, api) => {
			exposedAPI = api
			return api
		})
		preloadEncryptedStore()
	})

	it('should expose encryptedStore to the main world', () => {
		expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
			'encryptedStore',
			expect.any(Object)
		)
	})

	it('should expose on method that wraps ipcRenderer.on', () => {
		const channel = 'test-channel'
		const listener = vi.fn()
		// Create a mock event object
		const event = {} as any
		const args = ['arg1', 'arg2']

		exposedAPI.on(channel, listener)
		expect(ipcRenderer.on).toHaveBeenCalledWith(channel, expect.any(Function))

		// Get the wrapped listener function
		const wrappedListener = vi.mocked(ipcRenderer.on).mock.calls[0][1]
		// Call the wrapped listener
		wrappedListener(event, ...args)
		// Verify the original listener was called with the correct arguments
		expect(listener).toHaveBeenCalledWith(event, ...args)
	})

	it('should expose off method that wraps ipcRenderer.off', () => {
		const channel = 'test-channel'
		const listener = vi.fn()

		exposedAPI.off(channel, listener)
		expect(ipcRenderer.off).toHaveBeenCalledWith(channel, listener)
	})

	it('should expose send method that wraps ipcRenderer.send', () => {
		const channel = 'test-channel'
		const args = ['arg1', 'arg2']

		exposedAPI.send(channel, ...args)
		expect(ipcRenderer.send).toHaveBeenCalledWith(channel, ...args)
	})

	it('should expose invoke method that wraps ipcRenderer.invoke', () => {
		const channel = 'test-channel'
		const args = ['arg1', 'arg2']

		exposedAPI.invoke(channel, ...args)
		expect(ipcRenderer.invoke).toHaveBeenCalledWith(channel, ...args)
	})
})
