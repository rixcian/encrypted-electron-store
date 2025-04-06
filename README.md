<div align="center">
	<a href="https://rixcian.dev/projects/encrypted-electron-store">
		<img src="docs/icon.png" width="200" height="200">
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
		<a href="https://github.com/rixcian/encrypted-electron-store/blob/main/LICENSE">
			<img src="https://img.shields.io/npm/l/encrypted-electron-store.svg" alt="License">
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

Simple encrypted data persistence for your Electron app - Save and load user settings, app state, cache, etc.

<br />

It has the same API as the well-known `electron-store` library, but solves several other things:

- Encrypts the data saved on disk (with built-in Electron's `safeStorage` API)
- Support for React hooks (auto re-renders view on store update)
- Also works in `renderer` process (not like `electron-store` - [issue link](https://github.com/sindresorhus/electron-store/issues/268))
- Has CommonJS exports (`electron-store` has only ESM exports)
- Uses same API as `zustand` for getting values from store (via `useEncryptedStore` React hook)
  - e.g. `const encrypted = useEncryptedStore(store => store.encrypted)`

<br />

## Install

```sh
npm i encrypted-electron-store
```

## Usage

### Main process (`main.ts/js`)

```typescript
import EncryptedStore from 'encrypted-electron-store'

const store = new EncryptedStore()
// or: const store = new EncryptedStore<{ encrypted: string }>()

store.set('encrypted', '🔒')
console.log(store.get('encrypted'))
//=> '🔒'

store.delete('encrypted')
console.log(store.get('encrypted'))
//=> undefined
```

### Renderer process

If you want to use this library in `render` process as well, you firstly have to call this function in the `preload.ts/js` file.

```typescript
// preload.ts/js
import { preloadEncryptedStore } from 'encrypted-electron-store/preload'

preloadEncryptedStore()

// ... rest of the file
```

#### React

Add `EncryptedStoreProvider` component in `main.tsx/jsx` or where do you want in your React project.

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

Use `useEncryptedStore()` hook wherever you want in your React project.

```typescript
// e.g. App.tsx/jsx
import { useEncryptedStore } from 'encrypted-electron-store/react'

function App() {
  const { store, setStore } = useEncryptedStore<{ encrypted: string }>()
  const encrypted = useEncryptedStore<{ encrypted: string }>((store) => store.encrypted);

  setStore({ encrypted: '🔒' });

  return (
    /* Gets automatically re-rendered when the value gets changed */
    <p>{encrypted}</p>
  )
}
```

#### Vanilla JS

```typescript
import EncryptedStore from 'encrypted-electron-store/vanilla'

// You have to use `await` because the library is reading initial store from file on disk.
const store = await EncryptedStore.create<{ encrypted: string }>()

store.set('encrypted', '🔒')
console.log(store.get('encrypted'))
// => '🔒'
```

## Docs

_todo: Here will be specified detailed documentation; or just link to the official docs_

## Contribution

1. Clone this repo:

```sh
git clone https://github.com/rixcian/encrypted-electron-store
```

2. Make sure, you have node v22:

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

## Comparison with `electron-store`

| Feature                            | encrypted-electron-store               | electron-store                                                                                                                 |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Works in main & renderer processes | ✅ Yes                                 | 🟡 Only in main process                                                                                                        |
| ESM & CommonJS exports             | ✅ ESM & CJS Supported                 | ❌ Only ESM exports supported                                                                                                  |
| Encryption                         | ✅ Uses Electron's built-in encryption | 🟡 Not sufficient (encryption password in plaintext)                                                                           |
| React Integration                  | ✅ Built-in React hooks                | ❌ No React integration                                                                                                        |
| Vanilla JS Integration             | ✅ Simple API                          | ✅ Simple API                                                                                                                  |
| File Extensions                    | ✅ Configurable                        | ✅ Configurable                                                                                                                |
| Works with files atomically        | ✅ Yes                                 | ✅ Yes                                                                                                                         |
| JSON Schema validation             | 🟡 In future versions                  | ✅ Yes                                                                                                                         |
| Migrations                         | ❌ Yes, if there'll be demand          | 🟡 Yes, with bugs ([more info](https://github.com/sindresorhus/electron-store/issues?q=is%3Aissue%20state%3Aopen%20migration)) |

## Todos

- [x] Finish basic react implementation
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

- [x] Add possibility to pass only partial store object to `setStore({...partialObject})` func
- [x] Prepare tests for react part
- [x] Finish vanilla js implementation
- [x] Add possibility to define default/initial store value on store creation
  - [x] In the `main.ts` (in the main process)
  - [ ] In the `EncryptedStoreProvider` React context (`react.ts` - in the renderer process)
    - It will be only applied when there's no store already set from the file
  - [ ] In the `EncryptedStore` class (`vanilla.ts` - in the renderer process)
    - It will be only applied when there's no store already set from the file
- [ ] Compatibility with `electron-store`
  - [x] add `reset` func
  - [x] overload `set` func (set multiple items at once)
  - [x] update `get` func (add `defaultValue` optional parameter)
  - [x] add `has` func
  - [x] add `.size` prop
- [x] Work with the store file atomically
- [x] Setup tags/badges in README
- [x] Setup @changeset/cli
- [ ] Setup publishing to the NPM
- [ ] Create `examples` folder with electron projects
- [ ] Think about singleton implementation (this could help with the point about passing store through preload)
  - [ ] `EncryptedStore` class in the `main` lib
  - [x] `vanilla` (EncryptedStore class) and `react` (EncryptedStoreProvider) - renderers libraries; are designed as singletons
- [ ] Try to remove the `ReactJsxRuntime` from the final `react.es.js` and `react.cjs.js` builds
- [x] Do not forget to minify the library when debugging will be over
- [ ] Add JSON schema validation via `ajv`
- [ ] Try to remove the `await` from the vanillajs implementation (it shouldn't be necessary to read file when initializing the store from renderer; it should be already loaded in the `EncryptedStore` object in the `main.ts`)
- [x] Thinks about passing somehow the store through preload.ts (only possible with EncryptedStore class as singleton???)
  - On every change of the state call `contextBridge.exposeInMainWorld('encryptedStore', this.store)`, or just call this once when you're creating the singleton object (update: this can't be done, contextBridge can be called only in preload.ts)
- [ ] Add debug mode
