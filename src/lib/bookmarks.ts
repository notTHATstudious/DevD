import { isValidArticleUrl } from "@/lib/articleUrl";
import type { Article } from "@/lib/feed";

export type BookmarkedArticle = Article & { savedAt: number };

const BOOKMARKS_KEY = "dailyd_bookmarks";

type BookmarkStore = Record<string, BookmarkedArticle[]>;

/** Same normalization as feed dedupe — stable key for duplicate prevention. */
export function normalizeArticleUrl(url: string): string {
  return url.split("?")[0].replace(/\/$/, "").toLowerCase();
}

function readStore(): BookmarkStore {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as BookmarkStore;
  } catch {
    return {};
  }
}

function writeStore(store: BookmarkStore): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(store));
}

function userKey(username: string): string {
  return username.trim().toLowerCase();
}

function sanitizeList(list: unknown): BookmarkedArticle[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: BookmarkedArticle[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const a = item as Partial<BookmarkedArticle>;
    if (typeof a.title !== "string" || typeof a.url !== "string") continue;
    if (typeof a.source !== "string" || typeof a.publishedAt !== "number") continue;
    if (typeof a.description !== "string") continue;
    if (!isValidArticleUrl(a.url)) continue;
    const key = normalizeArticleUrl(a.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      title: a.title,
      url: a.url,
      source: a.source,
      author: typeof a.author === "string" ? a.author : undefined,
      publishedAt: a.publishedAt,
      description: a.description,
      savedAt: typeof a.savedAt === "number" ? a.savedAt : Date.now(),
    });
  }
  out.sort((a, b) => b.savedAt - a.savedAt);
  return out;
}

export function getBookmarks(username: string): BookmarkedArticle[] {
  const store = readStore();
  return sanitizeList(store[userKey(username)]);
}

export function getBookmarkCount(username: string): number {
  return getBookmarks(username).length;
}

export function isBookmarked(username: string, url: string): boolean {
  const key = normalizeArticleUrl(url);
  return getBookmarks(username).some((b) => normalizeArticleUrl(b.url) === key);
}

export function addBookmark(username: string, article: Article): BookmarkedArticle[] {
  const u = userKey(username);
  const store = readStore();
  const list = sanitizeList(store[u]);
  if (!isValidArticleUrl(article.url)) return list;
  const key = normalizeArticleUrl(article.url);
  if (list.some((b) => normalizeArticleUrl(b.url) === key)) {
    return list;
  }
  const next: BookmarkedArticle[] = [
    { ...article, savedAt: Date.now() },
    ...list,
  ];
  store[u] = next;
  writeStore(store);
  return next;
}

export function removeBookmark(username: string, url: string): BookmarkedArticle[] {
  const u = userKey(username);
  const store = readStore();
  const key = normalizeArticleUrl(url);
  const next = sanitizeList(store[u]).filter((b) => normalizeArticleUrl(b.url) !== key);
  store[u] = next;
  writeStore(store);
  return next;
}

export function toggleBookmark(username: string, article: Article): BookmarkedArticle[] {
  if (isBookmarked(username, article.url)) {
    return removeBookmark(username, article.url);
  }
  return addBookmark(username, article);
}
