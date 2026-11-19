import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/lib/feed";
import type { BookmarkedArticle } from "@/lib/bookmarks";
import type { FeedView } from "@/lib/feedView";

/** Guess for an item's height before it is measured (px). */
const ESTIMATED_HEIGHT = { card: 420, list: 190 };

/** Two columns of cards on wide screens; phones keep one. */
const WIDE_QUERY = "(min-width: 1024px)";

function useIsWide(): boolean {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia?.(WIDE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(WIDE_QUERY);
    if (!mq) return;
    const onChange = () => setWide(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return !!wide;
}

/** Extra cards kept rendered above and below the screen for smooth scrolling. */
export const OVERSCAN = 6;

type Props = {
  items: Article[];
  isBookmarked: (url: string) => boolean;
  isRead: (url: string) => boolean;
  onToggleBookmark: (article: Article) => void;
  onOpenArticle: (article: Article) => void;
  showSavedAt?: boolean;
  variant: FeedView;
  /** Changes whenever the filters change, so the list starts from the top again. */
  resetKey: string;
};

/**
 * Virtualized list: only the cards on screen (plus a few either side) exist in
 * the page, however long the feed is, so memory stays flat while scrolling.
 */
export default function ArticleList({
  items,
  isBookmarked,
  isRead,
  onToggleBookmark,
  onOpenArticle,
  showSavedAt,
  variant,
  resetKey,
}: Props) {
  const listRef = useRef<HTMLUListElement>(null);
  const isWide = useIsWide();
  const [scrollMargin, setScrollMargin] = useState(0);

  // The list starts below the header and filters; tell the virtualizer where.
  useLayoutEffect(() => {
    const update = () => setScrollMargin(listRef.current?.offsetTop ?? 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [resetKey]);

  // New filters: jump back to the top of the list if we're scrolled past it.
  const firstReset = useRef(true);
  useLayoutEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    const top = listRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 80 });
  }, [resetKey]);

  const lanes = variant === "card" && isWide ? 2 : 1;

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    lanes,
    estimateSize: () => ESTIMATED_HEIGHT[variant],
    overscan: OVERSCAN,
    scrollMargin,
    getItemKey: (index) => items[index].url,
  });

  // Column count changed (window resized): re-measure positions.
  useEffect(() => {
    virtualizer.measure();
  }, [lanes, virtualizer]);

  const rows = virtualizer.getVirtualItems();

  return (
    <ul
      ref={listRef}
      className={`relative ${variant === "list" ? "divide-y divide-border" : ""} ${lanes > 1 ? "-mx-2" : ""}`}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {rows.map((row) => {
        const a = items[row.index];
        return (
          <ArticleCard
            key={row.key}
            ref={virtualizer.measureElement}
            data-index={row.index}
            style={{
              position: "absolute",
              top: 0,
              left: `${(row.lane * 100) / lanes}%`,
              width: `${100 / lanes}%`,
              paddingInline: lanes > 1 ? 8 : undefined,
              transform: `translateY(${row.start - scrollMargin}px)`,
            }}
            variant={variant}
            article={a}
            bookmarked={isBookmarked(a.url)}
            read={isRead(a.url)}
            savedAt={showSavedAt ? (a as BookmarkedArticle).savedAt : undefined}
            onToggleBookmark={onToggleBookmark}
            onOpenArticle={onOpenArticle}
          />
        );
      })}
    </ul>
  );
}
