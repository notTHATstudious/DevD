import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  clearReadHistory,
  markArticleRead,
  normalizeArticleUrl,
  readStateStore,
} from "@/lib/readState";

/** Read history shared by every component (feed, Saved tab, assistant). */
export function useReadState() {
  const readEntries = useSyncExternalStore(readStateStore.subscribe, readStateStore.getSnapshot);

  const keys = useMemo(() => new Set(readEntries.map((e) => e.key)), [readEntries]);

  const isRead = useCallback((url: string) => keys.has(normalizeArticleUrl(url)), [keys]);

  const markRead = useCallback((url: string) => {
    markArticleRead(url);
  }, []);

  return {
    readEntries,
    isRead,
    markRead,
    clearHistory: clearReadHistory,
  };
}
