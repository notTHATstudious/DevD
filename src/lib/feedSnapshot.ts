import type { Article, FeedResult } from "@/lib/feed";
import { readJson } from "@/lib/localStore";

/**
 * A small copy of the newest articles, so the app can paint instantly on the
 * next visit while the full feed loads (or while the server wakes up).
 * Capped at 100 items (~60 KB) to keep storage use low.
 */
export const SNAPSHOT_KEY = "dailyd_feed_snapshot";
export const SNAPSHOT_SIZE = 100;
const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type Snapshot = { savedAt: number; articles: Article[] };

export function saveFeedSnapshot(articles: Article[]): void {
  const snapshot: Snapshot = {
    savedAt: Date.now(),
    articles: articles.slice(0, SNAPSHOT_SIZE),
  };
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota errors; the snapshot is only a nicety
  }
}

export function loadFeedSnapshot(now = Date.now()): FeedResult | undefined {
  const raw = readJson(SNAPSHOT_KEY) as Partial<Snapshot> | null;
  if (!raw || typeof raw.savedAt !== "number" || !Array.isArray(raw.articles)) return undefined;
  if (now - raw.savedAt > SNAPSHOT_MAX_AGE_MS) return undefined;
  const articles = raw.articles.filter(
    (a): a is Article =>
      !!a && typeof a.url === "string" && typeof a.title === "string" && typeof a.publishedAt === "number",
  );
  if (articles.length === 0) return undefined;
  return { articles, usedFallback: true, lastUpdated: raw.savedAt };
}
