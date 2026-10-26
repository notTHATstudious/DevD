import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getArticles } from "@/api/articles";
import { loadFeedSnapshot, saveFeedSnapshot } from "@/lib/feedSnapshot";

export const FEED_QUERY_KEY = ["feed"] as const;

/** How long feed data is considered fresh before a background refetch. */
export const FEED_STALE_TIME_MS = 15 * 60 * 1000;

/** How long inactive feed cache is kept in memory (React Query v5 `gcTime`). */
export const FEED_GC_TIME_MS = 30 * 60 * 1000;

export function useFeed() {
  // Read once per mount: shown instantly while the real request is in flight.
  const snapshot = useMemo(() => loadFeedSnapshot(), []);

  const query = useQuery({
    queryKey: FEED_QUERY_KEY,
    queryFn: getArticles,
    staleTime: FEED_STALE_TIME_MS,
    gcTime: FEED_GC_TIME_MS,
    refetchOnWindowFocus: false,
    placeholderData: snapshot,
    // A cold server answers 503 / times out for a while; keep trying with backoff.
    retry: 4,
    retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 10_000),
  });

  useEffect(() => {
    if (query.data && !query.isPlaceholderData && query.data.articles.length > 0) {
      saveFeedSnapshot(query.data.articles);
    }
  }, [query.data, query.isPlaceholderData]);

  return query;
}
