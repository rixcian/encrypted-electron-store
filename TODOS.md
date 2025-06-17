# Todos

- [x] Add possibility to pass only partial store object to `setStore({...partialObject})` function
- [x] Prepare tests for React part
- [x] Finish vanilla JS implementation
- [x] Add possibility to define default/initial store value on store creation
  - [x] In the `main.ts` (in the main process)
  - [x] In the `EncryptedStoreProvider` React context (`react.ts` - in the renderer process)
    - It will only be applied when there's no store already set from the file
  - [ ] In the `EncryptedStore` class (`vanilla.ts` - in the renderer process)
    - It will only be applied when there's no store already set from the file
- [x] Compatibility with `electron-store`
  - [x] Add `reset` function
  - [x] Overload `set` function (set multiple items at once)
  - [x] Update `get` function (add `defaultValue` optional parameter)
  - [x] Add `has` function
  - [x] Add `.size` property
- [x] Work with the store file atomically
  - [ ] Try to use just the `stubborn-fs`
- [x] Setup tags/badges in README
- [x] Setup @changeset/cli
- [x] Setup publishing to NPM
- [x] Do not publish some folders / files into NPM final package
- [ ] Create `examples` folder with Electron projects
  - [x] React project example
  - [ ] VanillaJS project example
- [x] Think about singleton implementation
  - [x] Add `singleton` option to the `EncryptedStore` class in the `main` lib
  - [x] `vanilla` (EncryptedStore class)
  - [x] `react` (EncryptedStoreProvider) - already designed as singletons
- [ ] Try to remove the `ReactJsxRuntime` from the final `react.es.js` and `react.cjs.js` builds
- [x] Do not forget to minify the library when debugging will be over
- [ ] Add JSON schema validation via `ajv`
- [ ] Try to remove the `await` from the vanilla JS implementation (it shouldn't be necessary to read file when initializing the store from renderer; it should be already loaded in the `EncryptedStore` object in the `main.ts`)
- [x] Think about passing somehow the store through preload.ts (only possible with EncryptedStore class as singleton???)
  - On every change of the state call `contextBridge.exposeInMainWorld('encryptedStore', this.store)`, or just call this once when you're creating the singleton object (update: this can't be done, contextBridge can be called only in preload.ts)
- [ ] Add debug mode

---

- [x] Make `EncryptedStore` class in `main.ts` as singleton

```typescript
const instances: Record<string, instanceof EncryptedStore> = {
  'store': <instance_of_encrypted_store>,
  'custom_store_name': <instance_of_encrypted_store>,
}

// In the constructor return the instance based on the "store name"
// By default it will use the name "store"
```

- [x] `EncryptedStore` class in `main.ts` should accept generic interface as a `T`, not Record, like it's right now
