export type Article = {
  title: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: number;
  description: string;
  topics: string[];
  isOfficial?: boolean;
  isTutorial?: boolean;
  isCommunity?: boolean;
  isNews?: boolean;
};

export type FeedResult = {
  articles: Article[];
  /** True when showing the locally saved snapshot while the network loads. */
  usedFallback: boolean;
  /** When the backend last refreshed its feeds (ms). */
  lastUpdated?: number;
};

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
