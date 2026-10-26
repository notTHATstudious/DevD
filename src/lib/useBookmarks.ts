import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Article } from "@/lib/feed";
import {
  bookmarkStore,
  normalizeArticleUrl,
  toggleBookmark as toggleStored,
} from "@/lib/bookmarks";

/** Bookmarks shared by every component (feed, Saved tab, assistant). */
export function useBookmarks() {
  const bookmarks = useSyncExternalStore(bookmarkStore.subscribe, bookmarkStore.get);

  const keys = useMemo(
    () => new Set(bookmarks.map((b) => normalizeArticleUrl(b.url))),
    [bookmarks],
  );

  const isBookmarked = useCallback(
    (url: string) => keys.has(normalizeArticleUrl(url)),
    [keys],
  );

  const toggleBookmark = useCallback((article: Article) => {
    toggleStored(article);
  }, []);

  return {
    bookmarks,
    count: bookmarks.length,
    isBookmarked,
    toggleBookmark,
  };
}
