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
- [ ] Finish vanilla js implementation
- [ ] Think about singleton implementation (this could help with the point about passing store through preload)
- [ ] Work with the store file atomically
- [ ] Create `examples` folder with electron projects
- [ ] Add debug mode
- [ ] Thinks about passing somehow the store through preload.ts

## encrypted-electron-store vs. electron-store

| Feature                | encrypted-electron-store               | electron-store                      |
| ---------------------- | -------------------------------------- | ----------------------------------- |
| ESM & CommonJS exports | ✅ ESM & CJS Supported                 | ❌ Only ESM exports supported       |
| Encryption             | ✅ Uses Electron's built-in encryption | 🟡 Encryption password in plaintext |
| React Integration      | ✅ Built-in React hooks                | ❌ No React integration             |
| Vanilla JS Integration | ✅ Simple API                          | ✅ Simple API                       |
| File Extensions        | ✅ Configurable                        | ✅ Configurable                     |
| Bundle Size            | 🟡 Medium (~5KB)                       | 🟡 Medium (~6KB)                    |
