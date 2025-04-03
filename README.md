# encrypted-electron-store

## todo

- [x] Finish basic react implementation
- [ ] Finish vanilla implementation
- [ ] Create `examples` folder with electron projects
- [ ] Add debug mode
- [ ] Work with the store file atomically
- [ ] Refactor tests (do them properly)
- [ ] Thinks about passing somehow the store through preload.ts
- [ ] Think about singleton implementation (this could help with the point above about passing store through preload)
- [ ] Add possibility to pass only partial store object to `setStore({...partialObject})` func
- [ ] Make `const time = useEncryptedStore((store, setStore) => store.time)` architecture possible (similar to `zustand`)

## encrypted-electron-store vs. electron-store

| Feature                | encrypted-electron-store               | electron-store                      |
| ---------------------- | -------------------------------------- | ----------------------------------- |
| ESM & CommonJS exports | ✅ ESM & CJS Supported                 | ❌ Only ESM exports supported       |
| Encryption             | ✅ Uses Electron's built-in encryption | 🟡 Encryption password in plaintext |
| React Integration      | ✅ Built-in React hooks                | ❌ No React integration             |
| Vanilla JS Integration | ✅ Simple API                          | ✅ Simple API                       |
| File Extensions        | ✅ Configurable                        | ✅ Configurable                     |
| Bundle Size            | 🟡 Medium (~5KB)                       | 🟡 Medium (~6KB)                    |
