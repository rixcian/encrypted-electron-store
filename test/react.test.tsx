import { act, render, renderHook } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EncryptedStoreProvider, useEncryptedStore } from '../src/react'
import { EVENTS } from '../src/types/events'

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
const mockOn = vi.fn()
const mockOff = vi.fn()

describe('EncryptedStoreProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Reset the mock implementation for each test
		mockInvoke.mockReset()
		mockOn.mockReset()
		mockOff.mockReset()

		// Restore the mockInvoke implementation
		mockInvoke.mockImplementation((channel: string, ...args: unknown[]) => {
			if (channel === EVENTS.ENCRYPTED_STORE_GET) {
				return Promise.resolve(mockedStore)
			}
			if (channel === EVENTS.ENCRYPTED_STORE_SET) {
				mockedStore = args[0] as { test: string }
				return Promise.resolve()
			}
			return Promise.resolve()
		})

		// Setup global window.encryptedStore mock
		vi.stubGlobal('encryptedStore', {
			invoke: mockInvoke,
			on: mockOn,
			off: mockOff,
		})

		// Mock React's useState
		vi.mock('react', async () => {
			const actual = await vi.importActual('react')
			return {
				...actual,
				useState: vi.fn((initial) => {
					const setState = vi.fn()
					return [initial, setState]
				}),
			}
		})
	})

	afterEach(() => {
		// Don't unstub globals here, as it might interfere with cleanup functions
	})

	it('should render children', () => {
		const { getByText } = render(
			<EncryptedStoreProvider>
				<div>Test Child</div>
			</EncryptedStoreProvider>
		)
		expect(getByText('Test Child')).toBeTruthy()
	})

	it('should throw an error if window.encryptedStore is not available', () => {
		// Remove the window.encryptedStore mock
		vi.unstubAllGlobals()

		expect(() => {
			render(
				<EncryptedStoreProvider>
					<div>Test Child</div>
				</EncryptedStoreProvider>
			)
		}).toThrow('window.encryptedStore is not available')
	})

	it('should get initial store from the main process', () => {
		const initialStore = { test: 'value' }
		mockInvoke.mockResolvedValueOnce(initialStore)

		render(
			<EncryptedStoreProvider>
				<div>Test Child</div>
			</EncryptedStoreProvider>
		)

		expect(mockInvoke).toHaveBeenCalledWith(EVENTS.ENCRYPTED_STORE_GET)
	})

	it('should set up event listeners for store updates', () => {
		render(
			<EncryptedStoreProvider>
				<div>Test Child</div>
			</EncryptedStoreProvider>
		)

		expect(mockOn).toHaveBeenCalledWith(EVENTS.ENCRYPTED_STORE_UPDATED, expect.any(Function))
	})

	it('should clean up event listeners on unmount', () => {
		const { unmount } = render(
			<EncryptedStoreProvider>
				<div>Test Child</div>
			</EncryptedStoreProvider>
		)

		unmount()

		expect(mockOff).toHaveBeenCalledWith(EVENTS.ENCRYPTED_STORE_UPDATED, expect.any(Function))
	})
})

describe('useEncryptedStore', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Reset the mock implementation for each test
		mockInvoke.mockReset()
		mockOn.mockReset()
		mockOff.mockReset()

		// Setup global window.encryptedStore mock
		vi.stubGlobal('encryptedStore', {
			invoke: mockInvoke,
			on: mockOn,
			off: mockOff,
		})
	})

	it('should throw an error if used outside of EncryptedStoreProvider', () => {
		expect(() => {
			renderHook(() => useEncryptedStore())
		}).toThrow('useEncryptedStore must be used within a EncryptedStoreProvider')
	})

	it('should return the store and setStore function', () => {
		const initialStore = { test: 'value' }
		mockInvoke.mockResolvedValueOnce(initialStore)

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<EncryptedStoreProvider>{children}</EncryptedStoreProvider>
		)

		const { result } = renderHook(() => useEncryptedStore(), { wrapper })

		expect(result.current).toHaveProperty('store')
		expect(result.current).toHaveProperty('setStore')
		expect(typeof result.current.setStore).toBe('function')
	})

	it('should allow setting store values', () => {
		const initialStore = { test: 'value' }
		mockInvoke.mockResolvedValueOnce(initialStore)

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<EncryptedStoreProvider>{children}</EncryptedStoreProvider>
		)

		const { result } = renderHook(() => useEncryptedStore(), { wrapper })

		act(() => {
			result.current.setStore({ newKey: 'newValue' })
		})

		expect(mockInvoke).toHaveBeenCalledWith(EVENTS.ENCRYPTED_STORE_SET, { newKey: 'newValue' })
	})

	it('should work with a selector function', () => {
		const initialStore = { test: 'value' }
		mockInvoke.mockResolvedValueOnce(initialStore)

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<EncryptedStoreProvider>{children}</EncryptedStoreProvider>
		)

		const { result } = renderHook(
			() =>
				useEncryptedStore((store, setStore) => ({
					value: store.test,
					updateValue: (newValue: string) => setStore({ test: newValue }),
				})),
			{ wrapper }
		)

		expect(result.current).toHaveProperty('value')
		expect(result.current).toHaveProperty('updateValue')
		expect(typeof result.current.updateValue).toBe('function')
	})
})
