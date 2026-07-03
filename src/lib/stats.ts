import type { Article } from "@/lib/feed";
import type { ReadEntry } from "@/lib/readState";

export interface ReadingStats {
  articlesAvailable: number;
  articlesRead: number;
  articlesUnread: number;
  savedArticlesCount: number;
  todayReadingCount: number;
  topTopic: string;
  topSource: string;
}

/** Computes reading statistics based on articles, read list, and bookmarks. */
export function calculateReadingStats(
  filteredArticles: Article[],
  readEntries: ReadEntry[],
  bookmarksCount: number,
  now = Date.now()
): ReadingStats {
  const readUrls = new Set(readEntries.map((e) => e.url.toLowerCase()));

  // 1. Available, Read, Unread counts for the active feed
  const articlesAvailable = filteredArticles.length;
  let articlesRead = 0;
  for (const art of filteredArticles) {
    if (readUrls.has(art.url.toLowerCase())) {
      articlesRead++;
    }
  }
  const articlesUnread = articlesAvailable - articlesRead;

  // 2. Today's read count
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  let todayReadingCount = 0;
  for (const entry of readEntries) {
    if (entry.readAt >= startOfTodayMs && entry.readAt <= now) {
      todayReadingCount++;
    }
  }

  // 3. Match read entries back to actual articles to find top topics and sources
  const topicCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};

  // Build a lookup map of url -> article
  const articleMap = new Map<string, Article>();
  for (const art of filteredArticles) {
    articleMap.set(art.url.toLowerCase(), art);
  }

  for (const entry of readEntries) {
    const art = articleMap.get(entry.url.toLowerCase());
    if (art) {
      // Count topics
      const topics = art.topics || [];
      for (const t of topics) {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      }
      // Count sources
      sourceCounts[art.source] = (sourceCounts[art.source] || 0) + 1;
    }
  }

  // Find top topic
  let topTopic = "N/A";
  let maxTopicCount = 0;
  for (const [topic, count] of Object.entries(topicCounts)) {
    if (count > maxTopicCount) {
      maxTopicCount = count;
      topTopic = topic;
    }
  }

  // Find top source
  let topSource = "N/A";
  let maxSourceCount = 0;
  for (const [source, count] of Object.entries(sourceCounts)) {
    if (count > maxSourceCount) {
      maxSourceCount = count;
      topSource = source;
    }
  }

  return {
    articlesAvailable,
    articlesRead,
    articlesUnread,
    savedArticlesCount: bookmarksCount,
    todayReadingCount,
    topTopic,
    topSource,
  };
}
