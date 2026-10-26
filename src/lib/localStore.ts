/**
 * Tiny localStorage-backed store shared by every component that uses it.
 *
 * - Parses storage once, then serves an in-memory copy (no JSON.parse per call).
 * - Notifies subscribers, so the feed, the Saved tab and the assistant stay in sync.
 * - Picks up changes made in other tabs via the `storage` event.
 * - Never throws on quota or privacy-mode errors; state just stays in memory.
 */
export type LocalStore<T> = {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
  /** Drop the in-memory copy (tests, or after clearing storage). */
  reset: () => void;
};

type Options<T> = {
  key: string;
  /** Turn whatever was stored (or null) into a valid value. */
  parse: (raw: unknown) => T;
  /** One-off migration when `key` has never been written. Return null to skip. */
  migrate?: () => T | null;
};

export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function removeKeys(keys: string[]): void {
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

export function createLocalStore<T>({ key, parse, migrate }: Options<T>): LocalStore<T> {
  let value: T | undefined;
  const listeners = new Set<() => void>();

  const write = (next: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Quota exceeded or storage disabled: keep working from memory.
    }
  };

  const load = (): T => {
    let hasKey = false;
    try {
      hasKey = localStorage.getItem(key) !== null;
    } catch {
      hasKey = false;
    }
    if (!hasKey && migrate) {
      const migrated = migrate();
      if (migrated !== null) {
        write(migrated);
        return migrated;
      }
    }
    return parse(readJson(key));
  };

  const emit = () => listeners.forEach((l) => l());

  let listeningToOtherTabs = false;
  const listenToOtherTabs = () => {
    if (listeningToOtherTabs || typeof window === "undefined") return;
    listeningToOtherTabs = true;
    window.addEventListener("storage", (e) => {
      if (e.key !== key && e.key !== null) return;
      value = parse(readJson(key));
      emit();
    });
  };

  return {
    get() {
      if (value === undefined) value = load();
      return value;
    },
    set(next) {
      value = next;
      write(next);
      emit();
    },
    subscribe(listener) {
      listenToOtherTabs();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      value = undefined;
    },
  };
}

/** Approximate bytes DailyD keeps in localStorage (UTF-16, so 2 bytes per char). */
export function getDailyDStorageBytes(): number {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("dailyd_")) continue;
      total += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2;
    }
  } catch {
    return 0;
  }
  return total;
}
