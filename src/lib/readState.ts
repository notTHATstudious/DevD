import { isValidArticleUrl } from "@/lib/articleUrl";
import { normalizeArticleUrl } from "@/lib/bookmarks";

export { normalizeArticleUrl };

export type ReadEntry = { url: string; readAt: number };

const READ_STATE_KEY = "dailyd_read_state";

type ReadStore = Record<string, ReadEntry[]>;

function readStore(): ReadStore {
  try {
    const raw = localStorage.getItem(READ_STATE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as ReadStore;
  } catch {
    return {};
  }
}

function writeStore(store: ReadStore): void {
  localStorage.setItem(READ_STATE_KEY, JSON.stringify(store));
}

function userKey(username: string): string {
  return username.trim().toLowerCase();
}

function sanitizeList(list: unknown): ReadEntry[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: ReadEntry[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Partial<ReadEntry>;
    if (typeof entry.url !== "string") continue;
    if (!isValidArticleUrl(entry.url)) continue;
    const key = normalizeArticleUrl(entry.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      url: entry.url,
      readAt: typeof entry.readAt === "number" ? entry.readAt : Date.now(),
    });
  }
  out.sort((a, b) => b.readAt - a.readAt);
  return out;
}

export function getReadEntries(username: string): ReadEntry[] {
  const store = readStore();
  return sanitizeList(store[userKey(username)]);
}

export function isArticleRead(username: string, url: string): boolean {
  const key = normalizeArticleUrl(url);
  return getReadEntries(username).some((e) => normalizeArticleUrl(e.url) === key);
}

export function markArticleRead(username: string, url: string): ReadEntry[] {
  const u = userKey(username);
  const store = readStore();
  const list = sanitizeList(store[u]);
  if (!isValidArticleUrl(url)) return list;

  const key = normalizeArticleUrl(url);
  if (list.some((e) => normalizeArticleUrl(e.url) === key)) {
    return list;
  }

  const next: ReadEntry[] = [{ url: url.trim(), readAt: Date.now() }, ...list];
  store[u] = next;
  writeStore(store);
  return next;
}

export function removeReadState(username: string, url: string): ReadEntry[] {
  const u = userKey(username);
  const store = readStore();
  const key = normalizeArticleUrl(url);
  const next = sanitizeList(store[u]).filter((e) => normalizeArticleUrl(e.url) !== key);
  store[u] = next;
  writeStore(store);
  return next;
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
