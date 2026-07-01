import { useCallback, useState } from "react";
import {
  getReadEntries,
  markArticleRead as markStored,
  normalizeArticleUrl,
  type ReadEntry,
} from "@/lib/readState";

export function useReadState(username: string) {
  const [readEntries, setReadEntries] = useState<ReadEntry[]>(() =>
    getReadEntries(username),
  );

  const isRead = useCallback(
    (url: string) => {
      const key = normalizeArticleUrl(url);
      return readEntries.some((e) => normalizeArticleUrl(e.url) === key);
    },
    [readEntries],
  );

  const markRead = useCallback(
    (url: string) => {
      setReadEntries(markStored(username, url));
    },
    [username],
  );

  return {
    readEntries,
    isRead,
    markRead,
  };
}
