import { isValidArticleUrl, normalizeArticleUrl } from "@/lib/articleUrl";
import type { Article } from "@/lib/feed";
import { createLocalStore, readJson, removeKeys } from "@/lib/localStore";

export { normalizeArticleUrl };

export type BookmarkedArticle = Article & { savedAt: number };

export const BOOKMARKS_KEY = "dailyd_bookmarks_v2";
/** v1 stored `{ [username]: BookmarkedArticle[] }` behind the old local login. */
export const LEGACY_BOOKMARKS_KEY = "dailyd_bookmarks";

/** Hard caps so saved data can't grow without bound. */
export const MAX_BOOKMARKS = 300;
const MAX_DESCRIPTION_CHARS = 300;
const MAX_TOPICS = 8;

function sanitizeArticle(item: unknown): BookmarkedArticle | null {
  if (!item || typeof item !== "object") return null;
  const a = item as Partial<BookmarkedArticle>;
  if (typeof a.title !== "string" || typeof a.url !== "string") return null;
  if (typeof a.source !== "string" || typeof a.publishedAt !== "number") return null;
  if (!isValidArticleUrl(a.url)) return null;
  const out: BookmarkedArticle = {
    title: a.title,
    url: a.url.trim(),
    source: a.source,
    publishedAt: a.publishedAt,
    description: typeof a.description === "string" ? a.description.slice(0, MAX_DESCRIPTION_CHARS) : "",
    // v1 dropped topics/flags, which made saved articles vanish under topic filters.
    topics: Array.isArray(a.topics)
      ? a.topics.filter((t): t is string => typeof t === "string").slice(0, MAX_TOPICS)
      : [],
    savedAt: typeof a.savedAt === "number" ? a.savedAt : Date.now(),
  };
  if (typeof a.author === "string" && a.author) out.author = a.author;
  if (a.isOfficial) out.isOfficial = true;
  if (a.isTutorial) out.isTutorial = true;
  if (a.isCommunity) out.isCommunity = true;
  if (a.isNews) out.isNews = true;
  return out;
}

export function sanitizeBookmarks(list: unknown): BookmarkedArticle[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: BookmarkedArticle[] = [];
  for (const item of list) {
    const a = sanitizeArticle(item);
    if (!a) continue;
    const key = normalizeArticleUrl(a.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  out.sort((a, b) => b.savedAt - a.savedAt);
  return out.slice(0, MAX_BOOKMARKS);
}

/** Merge every v1 user's bookmarks into the single, login-free list. */
function migrateLegacy(): BookmarkedArticle[] | null {
  const legacy = readJson(LEGACY_BOOKMARKS_KEY);
  if (legacy === null) return null;
  removeKeys([LEGACY_BOOKMARKS_KEY]);
  if (Array.isArray(legacy)) return sanitizeBookmarks(legacy);
  if (typeof legacy !== "object") return [];
  return sanitizeBookmarks(Object.values(legacy as Record<string, unknown>).flat());
}

export const bookmarkStore = createLocalStore<BookmarkedArticle[]>({
  key: BOOKMARKS_KEY,
  parse: sanitizeBookmarks,
  migrate: migrateLegacy,
});

export function getBookmarks(): BookmarkedArticle[] {
  return bookmarkStore.get();
}

export function getBookmarkCount(): number {
  return getBookmarks().length;
}

export function isBookmarked(url: string): boolean {
  const key = normalizeArticleUrl(url);
  return getBookmarks().some((b) => normalizeArticleUrl(b.url) === key);
}

export function addBookmark(article: Article): BookmarkedArticle[] {
  const list = getBookmarks();
  if (!isValidArticleUrl(article.url) || isBookmarked(article.url)) return list;
  const entry = sanitizeArticle({ ...article, savedAt: Date.now() });
  if (!entry) return list;
  const next = [entry, ...list].slice(0, MAX_BOOKMARKS);
  bookmarkStore.set(next);
  return next;
}

export function removeBookmark(url: string): BookmarkedArticle[] {
  const key = normalizeArticleUrl(url);
  const next = getBookmarks().filter((b) => normalizeArticleUrl(b.url) !== key);
  bookmarkStore.set(next);
  return next;
}

export function toggleBookmark(article: Article): BookmarkedArticle[] {
  return isBookmarked(article.url) ? removeBookmark(article.url) : addBookmark(article);
}
