import { isValidArticleUrl, normalizeArticleUrl } from "@/lib/articleUrl";
import { createLocalStore, readJson, removeKeys } from "@/lib/localStore";

export { normalizeArticleUrl };

/** `key` is the normalized article URL (see normalizeArticleUrl). */
export type ReadEntry = { key: string; readAt: number };

export const READ_STATE_KEY = "dailyd_read_v2";
/** v1 stored `{ [username]: {url, readAt}[] }` behind the old local login. */
export const LEGACY_READ_STATE_KEY = "dailyd_read_state";

/** Keep read history small: the newest N entries, and nothing older than this. */
export const MAX_READ_ENTRIES = 1000;
export const READ_HISTORY_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

/** Stored compactly as [key, readAt] pairs, newest first. */
type StoredEntry = [string, number];

function sanitize(list: unknown, now = Date.now()): ReadEntry[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: ReadEntry[] = [];
  for (const item of list) {
    let key: unknown;
    let readAt: unknown;
    if (Array.isArray(item)) [key, readAt] = item;
    else if (item && typeof item === "object") {
      // v1 entry: { url, readAt }
      const legacy = item as { url?: unknown; readAt?: unknown };
      if (typeof legacy.url !== "string" || !isValidArticleUrl(legacy.url)) continue;
      key = normalizeArticleUrl(legacy.url);
      readAt = legacy.readAt;
    }
    if (typeof key !== "string" || !key) continue;
    const at = typeof readAt === "number" ? readAt : now;
    if (now - at > READ_HISTORY_MAX_AGE_MS) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ key, readAt: at });
  }
  out.sort((a, b) => b.readAt - a.readAt);
  return out.slice(0, MAX_READ_ENTRIES);
}

function migrateLegacy(): StoredEntry[] | null {
  const legacy = readJson(LEGACY_READ_STATE_KEY);
  if (legacy === null) return null;
  removeKeys([LEGACY_READ_STATE_KEY]);
  const list = Array.isArray(legacy)
    ? legacy
    : typeof legacy === "object"
      ? Object.values(legacy as Record<string, unknown>).flat()
      : [];
  return sanitize(list).map((e) => [e.key, e.readAt]);
}

const store = createLocalStore<StoredEntry[]>({
  key: READ_STATE_KEY,
  parse: (raw) => sanitize(raw).map((e) => [e.key, e.readAt]),
  migrate: migrateLegacy,
});

let cachedSource: StoredEntry[] | null = null;
let cachedEntries: ReadEntry[] = [];

/** Snapshot of read entries; the same array is returned until something changes. */
export function getReadEntries(): ReadEntry[] {
  const raw = store.get();
  if (raw !== cachedSource) {
    cachedSource = raw;
    cachedEntries = raw.map(([key, readAt]) => ({ key, readAt }));
  }
  return cachedEntries;
}

export const readStateStore = {
  subscribe: store.subscribe,
  getSnapshot: getReadEntries,
  reset: () => {
    store.reset();
    cachedSource = null;
  },
};

export function isArticleRead(url: string): boolean {
  const key = normalizeArticleUrl(url);
  return getReadEntries().some((e) => e.key === key);
}

export function markArticleRead(url: string): ReadEntry[] {
  if (!isValidArticleUrl(url) || isArticleRead(url)) return getReadEntries();
  const entry: StoredEntry = [normalizeArticleUrl(url), Date.now()];
  const next = [entry, ...store.get()].slice(0, MAX_READ_ENTRIES);
  store.set(next);
  return getReadEntries();
}

export function removeReadState(url: string): ReadEntry[] {
  const key = normalizeArticleUrl(url);
  store.set(store.get().filter(([k]) => k !== key));
  return getReadEntries();
}

export function clearReadHistory(): void {
  store.set([]);
}

export type ReadFilter = "all" | "read" | "unread";

/** Filter articles by read state. Composes with search filtering. */
export function filterArticlesByReadState<T extends { url: string }>(
  articles: T[],
  filter: ReadFilter,
  isRead: (url: string) => boolean,
): T[] {
  if (filter === "all") return articles;
  if (filter === "read") return articles.filter((a) => isRead(a.url));
  return articles.filter((a) => !isRead(a.url));
}
