import "@testing-library/jest-dom";

// Node 25+ ships its own `localStorage` global, which is undefined unless Node
// runs with --localstorage-file, and it shadows jsdom's. Provide an in-memory one.
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  let works = false;
  try {
    works = typeof globalThis[name]?.getItem === "function";
  } catch {
    works = false;
  }
  if (!works) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: new MemoryStorage(),
    });
  }
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
