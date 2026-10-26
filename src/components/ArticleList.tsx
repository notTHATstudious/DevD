import { useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/lib/feed";
import type { BookmarkedArticle } from "@/lib/bookmarks";

/** Guess for a card's height before it is measured (px). */
const ESTIMATED_CARD_HEIGHT = 190;

/** Extra cards kept rendered above and below the screen for smooth scrolling. */
export const OVERSCAN = 6;

type Props = {
  items: Article[];
  isBookmarked: (url: string) => boolean;
  isRead: (url: string) => boolean;
  onToggleBookmark: (article: Article) => void;
  onOpenArticle: (article: Article) => void;
  showSavedAt?: boolean;
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
  resetKey,
}: Props) {
  const listRef = useRef<HTMLUListElement>(null);
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

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: OVERSCAN,
    scrollMargin,
    getItemKey: (index) => items[index].url,
  });

  const rows = virtualizer.getVirtualItems();

  return (
    <ul
      ref={listRef}
      className="relative divide-y divide-border"
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
              left: 0,
              width: "100%",
              transform: `translateY(${row.start - scrollMargin}px)`,
            }}
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
