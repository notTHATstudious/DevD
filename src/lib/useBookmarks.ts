import { useCallback, useState } from "react";
import type { Article } from "@/lib/feed";
import {
  getBookmarks,
  normalizeArticleUrl,
  toggleBookmark as toggleStored,
  type BookmarkedArticle,
} from "@/lib/bookmarks";

export function useBookmarks(username: string) {
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>(() =>
    getBookmarks(username),
  );

  const isBookmarked = useCallback(
    (url: string) => {
      const key = normalizeArticleUrl(url);
      return bookmarks.some((b) => normalizeArticleUrl(b.url) === key);
    },
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    (article: Article) => {
      setBookmarks(toggleStored(username, article));
    },
    [username],
  );

  return {
    bookmarks,
    count: bookmarks.length,
    isBookmarked,
    toggleBookmark,
  };
}
