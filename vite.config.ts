import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import type { UserConfigExport } from 'vitest/config'

export default defineConfig({
	plugins: [dts()],
	esbuild: {
		jsx: 'automatic',
		target: 'es2020',
	},
	build: {
		minify: false,
		lib: {
			entry: {
				main: resolve(dirname(fileURLToPath(import.meta.url)), 'src/main.ts'),
				preload: resolve(dirname(fileURLToPath(import.meta.url)), 'src/preload.ts'),
				react: resolve(dirname(fileURLToPath(import.meta.url)), 'src/react.tsx'),
				events: resolve(dirname(fileURLToPath(import.meta.url)), 'src/types/events.ts'),
			},
			fileName: (format, entryName) => `${entryName}.${format}.js`,
			formats: ['es', 'cjs'],
		},
		rollupOptions: {
			external: ['electron', 'crypto', 'react', 'react-dom', 'node:fs', 'node:path'],
			output: {
				format: 'cjs',
				esModule: false,
				globals: {
					electron: 'electron',
					crypto: 'crypto',
					react: 'React',
					'react-dom': 'ReactDOM',
					'node:fs': 'fs',
					'node:path': 'path',
				},
			},
		},
		target: 'es2020',
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['test/**/*.test.ts'], // Include only .ts test files for now (ignore renderer tests)
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
	},
} as UserConfigExport)
