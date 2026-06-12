import { useQuery } from "@tanstack/react-query";
import { fetchAllArticles } from "@/lib/feed";

export const FEED_QUERY_KEY = ["feed"] as const;

/** How long feed data is considered fresh before a background refetch. */
export const FEED_STALE_TIME_MS = 15 * 60 * 1000;

/** How long inactive feed cache is kept in memory (React Query v5 `gcTime`). */
export const FEED_GC_TIME_MS = 30 * 60 * 1000;

export function useFeed(enabled: boolean) {
  return useQuery({
    queryKey: FEED_QUERY_KEY,
    queryFn: fetchAllArticles,
    enabled,
    staleTime: FEED_STALE_TIME_MS,
    gcTime: FEED_GC_TIME_MS,
    refetchOnWindowFocus: false,
  });
}
