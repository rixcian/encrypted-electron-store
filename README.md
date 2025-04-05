# encrypted-electron-store

## todo

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
  - [ ] add `has` func
  - [ ] add `.size` prop
- [ ] Work with the store file atomically
- [ ] Create `examples` folder with electron projects
- [ ] Think about singleton implementation (this could help with the point about passing store through preload)
  - [ ] `EncryptedStore` class in the `main` lib
  - [x] `vanilla` (EncryptedStore class) and `react` (EncryptedStoreProvider) - renderers libraries; are designed as singletons
- [ ] Try to remove the `ReactJsxRuntime` from the final `react.es.js` and `react.cjs.js` builds
- [ ] Do not forget to minify the library when debugging will be over
- [ ] Add JSON schema validation via `ajv`
- [x] Thinks about passing somehow the store through preload.ts (only possible with EncryptedStore class as singleton???)
  - On every change of the state call `contextBridge.exposeInMainWorld('encryptedStore', this.store)`, or just call this once when you're creating the singleton object (update: this can't be done, contextBridge can be called only in preload.ts)
- [ ] Add debug mode

## encrypted-electron-store vs. electron-store

| Feature                | encrypted-electron-store               | electron-store                      |
| ---------------------- | -------------------------------------- | ----------------------------------- |
| ESM & CommonJS exports | ✅ ESM & CJS Supported                 | ❌ Only ESM exports supported       |
| Encryption             | ✅ Uses Electron's built-in encryption | 🟡 Encryption password in plaintext |
| React Integration      | ✅ Built-in React hooks                | ❌ No React integration             |
| Vanilla JS Integration | ✅ Simple API                          | ✅ Simple API                       |
| File Extensions        | ✅ Configurable                        | ✅ Configurable                     |
| Bundle Size            | 🟡 Medium (~5KB)                       | 🟡 Medium (~6KB)                    |
