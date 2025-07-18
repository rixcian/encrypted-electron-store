<div align="center">
	<a href="https://rixcian.dev/projects/encrypted-electron-store">
		<img src="https://raw.githubusercontent.com/rixcian/encrypted-electron-store/refs/heads/master/docs/icon.png" width="200" height="200">
	</a>
	<h1>encrypted-electron-store</h1>
  <p>
		<a href="https://www.npmjs.com/package/encrypted-electron-store">
			<img src="https://img.shields.io/npm/v/encrypted-electron-store.svg" alt="npm version">
		</a>
		<a href="https://www.npmjs.com/package/encrypted-electron-store">
			<img src="https://img.shields.io/npm/dm/encrypted-electron-store.svg" alt="npm downloads">
		</a>
		<a href="https://codecov.io/gh/rixcian/encrypted-electron-store"> 
      <img src="https://codecov.io/gh/rixcian/encrypted-electron-store/graph/badge.svg?token=H5DRJNXCZ7"/>
    </a>
		<a href="https://github.com/rixcian/encrypted-electron-store/blob/master/LICENSE">
			<img src="https://img.shields.io/npm/l/encrypted-electron-store" alt="License">
		</a>
		<a href="https://github.com/rixcian/encrypted-electron-store/issues">
			<img src="https://img.shields.io/github/issues/rixcian/encrypted-electron-store.svg" alt="Issues">
		</a>
		<a href="https://github.com/rixcian/encrypted-electron-store/pulls">
			<img src="https://img.shields.io/github/issues-pr/rixcian/encrypted-electron-store.svg" alt="Pull Requests">
		</a>
	</p>
	<br>
</div>

Simple encrypted data persistence for your Electron app - Save and load user settings, app state, cache, and more.

You can use it as a **single** store for both the `main` and `renderer` processes.

<br />

It has the same features as the well-known `electron-store` library, but solves several other things:

- Encrypts the data saved on disk (using Electron's built-in `safeStorage` API)
- Support for React hooks (auto re-renders view on store update)
- Works in the `renderer` process (unlike `electron-store` - [issue link](https://github.com/sindresorhus/electron-store/issues/268))
- Has CommonJS exports (`electron-store` has only ESM exports)
- Uses the same API as `zustand` for getting values from store (via `useEncryptedStore` React hook)
  - e.g. `const encrypted = useEncryptedStore(store => store.encrypted)`

<br />

## Install

```sh
npm i encrypted-electron-store
```

```sh
pnpm i encrypted-electron-store
```

```sh
yarn add encrypted-electron-store
```

## Usage

### Main process (`main.ts/js`)

```typescript
import EncryptedStore from 'encrypted-electron-store/main'

const store = EncryptedStore.create<any>()
// or: const store = EncryptedStore.create<{ encrypted: string }>()
// or: const store = EncryptedStore.create<IStore>()

store.set('encrypted', '🔒')
console.log(store.get('encrypted'))
//=> '🔒'

store.delete('encrypted')
console.log(store.get('encrypted'))
//=> undefined

// IMPORTANT: If you want to use the store in the renderer process
window.webContents.on('did-finish-load', () => {
	encryptedStore.setBrowserWindow(window)
})
```

### Renderer process

If you want to use this library in the `renderer` process, you first need to call this function in the `preload.ts/js` file.

```typescript
// preload.ts/js
import { preloadEncryptedStore } from 'encrypted-electron-store/preload'

preloadEncryptedStore()

// ... rest of the file
```

#### React

Add the `EncryptedStoreProvider` component in `main.tsx/jsx` or wherever you want in your React project.

```typescript
// main.tsx/jsx
import { EncryptedStoreProvider } from 'encrypted-electron-store/react'

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EncryptedStoreProvider>
      <App />
    </EncryptedStoreProvider>
  </React.StrictMode>
);
```

Use the `useEncryptedStore()` hook wherever you want in your React project.

```typescript
// e.g. App.tsx/jsx
import { useEncryptedStore } from 'encrypted-electron-store/react'

function App() {
  const { store, setStore } = useEncryptedStore<{ encrypted: string }>()
  const encrypted = useEncryptedStore<{ encrypted: string }>((store) => store.encrypted);

  setStore({ encrypted: '🔒' });

  return (
    /* Gets automatically re-rendered when the value changes */
    <p>{encrypted}</p>
  )
}
```

#### Vanilla JS

```typescript
import EncryptedStore from 'encrypted-electron-store/vanilla'

// You need to use `await` because the library reads the initial store from the file on disk.
const store = await EncryptedStore.create<{ encrypted: string }>()

store.set('encrypted', '🔒')
console.log(store.get('encrypted'))
// => '🔒'
```

## Docs

You can find examples of usage in real projects in the `examples` folder.

_todo: Here will be specified detailed documentation; or just link to the official docs_

## Contribution

1. Clone this repo:

```sh
git clone https://github.com/rixcian/encrypted-electron-store
```

2. Make sure you have node v22:

```sh
nvm use
```

3. Install dependencies:

```sh
npm i
```

4. After making changes, run tests:

```sh
npm run test
```

5. Create changelog:

```sh
npx @changesets/cli
```

6. As a maintainer, after review, I will run:

```sh
npx @changesets/cli version
```

7. Build the library:

```sh
npm run build
```

8. And publish it to NPM with:

```sh
npx @changesets/cli publish
```

## Comparison to `electron-store`

| Feature                            | encrypted-electron-store               | electron-store                                                                                                                 |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Works in main & renderer processes | ✅ Yes                                 | 🟡 Only in main process                                                                                                        |
| ESM & CommonJS exports             | ✅ ESM & CJS Supported                 | ❌ Only ESM exports supported                                                                                                  |
| Encryption                         | ✅ Uses Electron's built-in encryption | 🟡 Not sufficient (encryption password in plaintext)                                                                           |
| React Integration                  | ✅ Built-in React hooks                | ❌ No React integration                                                                                                        |
| Vanilla JS Integration             | ✅ Simple API                          | ✅ Simple API                                                                                                                  |
| File Extensions                    | ✅ Configurable                        | ✅ Configurable                                                                                                                |
| Works with files atomically        | ✅ Yes                                 | ✅ Yes                                                                                                                         |
| JSON Schema validation             | 🟡 Work in progress                    | ✅ Yes                                                                                                                         |
| Migrations                         | ❌ Yes, if there'll be demand          | 🟡 Yes, with bugs ([more info](https://github.com/sindresorhus/electron-store/issues?q=is%3Aissue%20state%3Aopen%20migration)) |

## Todos

- [x] Finish basic React implementation
- [x] Make `const time = useEncryptedStore((store, setStore) => store.time)` architecture possible (similar to `zustand`)

```typescript
// Usage
const { store, setStore } = useEncryptedStore<Store>()
const time = useEncryptedStore<Store>((store) => store.time)
const setStore = useEncryptedStore<Store>((_, setStore) => setStore)

// Another possible usage
const { store, setStore } = useEncryptedStore<Store>()
const { time, setStore } = useEncryptedStore<Store>((store, setStore) => ({
	time: store.time,
	setStore,
}))
```
