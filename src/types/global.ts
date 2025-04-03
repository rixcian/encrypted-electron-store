interface IPCRenderer {
	send: (channel: string, ...args: unknown[]) => unknown
	on: (channel: string, callback: (...args: unknown[]) => void) => void
	off: (channel: string, callback: (...args: unknown[]) => void) => void
	invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
}

declare global {
	interface Window {
		encryptedStore: IPCRenderer
	}
}

export {}
