import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { BarChart3, Bookmark, Newspaper, Search, SlidersHorizontal, X } from "lucide-react";
import { type Article } from "@/lib/feed";
import { filterArticles } from "@/lib/search";
import { filterArticlesByReadState, type ReadFilter } from "@/lib/readState";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBookmarks } from "@/lib/useBookmarks";
import { useReadState } from "@/lib/useReadState";
import { useFeed } from "@/lib/useFeed";
import AppHeader from "@/components/AppHeader";
import ArticleList from "@/components/ArticleList";
import CategoryChips from "@/components/CategoryChips";
import EmptyState from "@/components/EmptyState";
import PreferencesPanel from "@/components/PreferencesPanel";
import StatsPanel from "@/components/StatsPanel";
import LegalFooter from "@/components/LegalFooter";

// Only downloaded when someone actually waits for a cold server.
const CoffeeRun = lazy(() => import("@/components/CoffeeRun"));
import {
  TOPIC_KEYS,
  getSavedPreferences,
  savePreferences,
  filterByTopicPreferences,
  type TopicPreferences,
} from "@/lib/preferences";
import { filterByCategory, type CategoryKey } from "@/lib/categories";
import { sortArticlesByRelevance } from "@/lib/ranking";
import { calculateReadingStats } from "@/lib/stats";

type Tab = "feed" | "saved" | "preferences" | "stats";

const TABS: { key: Tab; label: string; icon: typeof Newspaper }[] = [
  { key: "feed", label: "Feed", icon: Newspaper },
  { key: "saved", label: "Saved", icon: Bookmark },
  { key: "preferences", label: "Topics", icon: SlidersHorizontal },
  { key: "stats", label: "Stats", icon: BarChart3 },
];

const HEADINGS: Record<Tab, { title: string; subtitle: string }> = {
  feed: {
    title: "Today's feed",
    subtitle: "Engineering blogs, big tech newsrooms and gadget news in one place.",
  },
  saved: { title: "Saved articles", subtitle: "Articles you've bookmarked on this device." },
  preferences: { title: "Your topics", subtitle: "Choose what shows up in your feed." },
  stats: { title: "Reading stats", subtitle: "A quick look at your reading habits." },
};

/** After this long without data, explain that the free server may be waking up. */
const SLOW_LOAD_HINT_MS = 4000;

const EMPTY: Article[] = [];

const Index = () => {
  const [tab, setTab] = useState<Tab>("feed");
  const [searchInput, setSearchInput] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [category, setCategory] = useState<CategoryKey>("all");
  const debouncedQuery = useDebouncedValue(searchInput, 250);
  const [topicPrefs, setTopicPrefs] = useState<TopicPreferences>(getSavedPreferences);

  const {
    data: feedData,
    isPending,
    isFetching,
    isError,
    isPlaceholderData,
    error,
    refetch,
    dataUpdatedAt,
  } = useFeed();

  const articles = feedData?.articles ?? EMPTY;
  const hasArticles = articles.length > 0;

  const { bookmarks, count, isBookmarked, toggleBookmark } = useBookmarks();
  const { readEntries, isRead, markRead, clearHistory } = useReadState();

  const [slowLoad, setSlowLoad] = useState(false);
  // Mini game shown while the server wakes up; stays until the player chooses "Go in".
  const [gameOpen, setGameOpen] = useState(false);
  // Opened from the header button rather than because the server is slow.
  const [casualGame, setCasualGame] = useState(false);
  const waiting = isPending || isPlaceholderData;
  useEffect(() => {
    if (isPending && slowLoad) setGameOpen(true);
  }, [isPending, slowLoad]);
  useEffect(() => {
    if (!waiting) {
      setSlowLoad(false);
      return;
    }
    const t = setTimeout(() => setSlowLoad(true), SLOW_LOAD_HINT_MS);
    return () => clearTimeout(t);
  }, [waiting]);

  const handlePrefsChange = (next: TopicPreferences) => {
    setTopicPrefs(next);
    savePreferences(next);
  };

  const activeTopicKeys = useMemo(() => TOPIC_KEYS.filter((k) => topicPrefs[k]), [topicPrefs]);

  // Topic preferences → relevance ranking → category chip.
  const rankedFeed = useMemo(
    () => sortArticlesByRelevance(filterByTopicPreferences(articles, topicPrefs), activeTopicKeys),
    [articles, topicPrefs, activeTopicKeys],
  );
  const categoryFeed = useMemo(() => filterByCategory(rankedFeed, category), [rankedFeed, category]);
  const categorySaved = useMemo(
    () => filterByCategory(filterByTopicPreferences(bookmarks, topicPrefs), category),
    [bookmarks, topicPrefs, category],
  );

  // Then search, then read/unread.
  const searchedFeed = useMemo(() => filterArticles(categoryFeed, debouncedQuery), [categoryFeed, debouncedQuery]);
  const searchedSaved = useMemo(() => filterArticles(categorySaved, debouncedQuery), [categorySaved, debouncedQuery]);
  const visibleFeed = useMemo(
    () => filterArticlesByReadState(searchedFeed, readFilter, isRead),
    [searchedFeed, readFilter, isRead],
  );
  const visibleSaved = useMemo(
    () => filterArticlesByReadState(searchedSaved, readFilter, isRead),
    [searchedSaved, readFilter, isRead],
  );

  const stats = useMemo(
    () => calculateReadingStats(categoryFeed, readEntries, count, Date.now()),
    [categoryFeed, readEntries, count],
  );

  const isSearching = debouncedQuery.trim().length > 0;
  const isFiltering = readFilter !== "all" || category !== "all";
  const resetKey = `${tab}|${category}|${readFilter}|${debouncedQuery}|${activeTopicKeys.length}`;
  const errorMsg = error instanceof Error ? error.message : "Failed to load feed";

  const clearFilters = () => {
    setReadFilter("all");
    setCategory("all");
  };

  const showListControls = tab === "feed" || tab === "saved";
  const showSearch = tab === "feed" ? hasArticles : tab === "saved" && count > 0;
  const shownCount = tab === "feed" ? visibleFeed.length : visibleSaved.length;
  const totalCount = tab === "feed" ? articles.length : count;

  const listProps = {
    isBookmarked,
    isRead,
    onToggleBookmark: toggleBookmark,
    onOpenArticle: (article: Article) => markRead(article.url),
    resetKey,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        lastUpdated={isPlaceholderData ? undefined : feedData?.lastUpdated}
        refreshing={isFetching}
        onRefresh={() => refetch()}
        onPlay={() => {
          // The header button toggles the game.
          if (gameOpen && tab === "feed") {
            setGameOpen(false);
            return;
          }
          setTab("feed");
          // While the server is still waking, keep the "site is ready?" flow.
          setCasualGame(!(isPending || isPlaceholderData));
          setGameOpen(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <section className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{HEADINGS[tab].title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{HEADINGS[tab].subtitle}</p>

          <nav aria-label="Sections" className="mt-5 grid grid-cols-4 rounded-full border border-border p-0.5">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                aria-current={tab === key ? "page" : undefined}
                onClick={() => setTab(key)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition ${
                  tab === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {key === "saved" && count > 0 && (
                  <span
                    className={`inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                      tab === "saved" ? "bg-background text-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {showListControls && (
            <div className="mt-4 space-y-3">
              {showSearch && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search title, source, author…"
                    aria-label="Search articles"
                    className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-foreground focus:ring-1 focus:ring-foreground"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              <CategoryChips value={category} onChange={setCategory} />

              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex rounded-full border border-border p-0.5">
                  {(["all", "unread", "read"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setReadFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                        readFilter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {totalCount > 0 && (
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {isSearching || isFiltering ? `${shownCount} of ${totalCount}` : `${totalCount} articles`}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        <main className="pb-24">
          {tab === "feed" && (
            <>
              {gameOpen && (
                <Suspense fallback={null}>
                  <CoffeeRun
                    key={casualGame ? "casual" : "waiting"}
                    casual={casualGame}
                    siteReady={!isPending && !isPlaceholderData}
                    onEnter={() => {
                      setGameOpen(false);
                      setCasualGame(false);
                    }}
                  />
                </Suspense>
              )}
              {isPlaceholderData && !gameOpen && (
                <Notice action={slowLoad ? { label: "Play while you wait", onClick: () => setGameOpen(true) } : undefined}>
                  {slowLoad
                    ? "Showing your saved feed — the server is waking up, fresh articles will appear on their own."
                    : "Showing your saved feed while the latest articles load…"}
                </Notice>
              )}
              {isError && hasArticles && !isFetching && (
                <Notice action={{ label: "Retry", onClick: () => refetch() }}>
                  Couldn't refresh the feed ({errorMsg}). Showing what was loaded before.
                </Notice>
              )}

              {isPending && (
                <>
                  {slowLoad && !gameOpen && (
                    <Notice>
                      Waking up the server — after a while without visitors the first load can take up to
                      a minute. This only happens once.
                    </Notice>
                  )}
                  <LoadingList />
                </>
              )}

              {isError && !hasArticles && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                  <p className="font-medium">Couldn't load the feed.</p>
                  <p className="mt-1 text-muted-foreground">{errorMsg}</p>
                  <button
                    onClick={() => refetch()}
                    className="mt-3 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!isPending && !isError && !hasArticles && <EmptyState title="No articles found." />}

              {hasArticles && searchedFeed.length === 0 && isSearching && (
                <NoSearchResults query={debouncedQuery} onClear={() => setSearchInput("")} />
              )}
              {hasArticles && visibleFeed.length === 0 && !(isSearching && searchedFeed.length === 0) && (
                <EmptyState
                  title="Nothing matches these filters."
                  description="Try another category or show read articles too."
                  actionLabel="Clear filters"
                  onAction={clearFilters}
                />
              )}

              {visibleFeed.length > 0 && <ArticleList items={visibleFeed} {...listProps} />}
            </>
          )}

          {tab === "saved" && (
            <>
              {count === 0 && (
                <EmptyState
                  title="No saved articles yet."
                  description="Tap the bookmark icon on any article to keep it here."
                  actionLabel="Browse feed"
                  onAction={() => setTab("feed")}
                />
              )}
              {count > 0 && searchedSaved.length === 0 && isSearching && (
                <NoSearchResults query={debouncedQuery} onClear={() => setSearchInput("")} />
              )}
              {count > 0 && visibleSaved.length === 0 && !(isSearching && searchedSaved.length === 0) && (
                <EmptyState
                  title="Nothing matches these filters."
                  actionLabel="Clear filters"
                  onAction={clearFilters}
                />
              )}
              {visibleSaved.length > 0 && <ArticleList items={visibleSaved} showSavedAt {...listProps} />}
            </>
          )}

          {tab === "preferences" && <PreferencesPanel prefs={topicPrefs} onChange={handlePrefsChange} />}

          {tab === "stats" && (
            <StatsPanel
              stats={stats}
              readHistoryCount={readEntries.length}
              dataUpdatedAt={isPlaceholderData ? undefined : dataUpdatedAt}
              onClearHistory={clearHistory}
            />
          )}
        </main>

        <LegalFooter />
      </div>
    </div>
  );
};

function Notice({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      role="status"
      className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
    >
      <span>{children}</span>
      {action && (
        <button onClick={action.onClick} className="shrink-0 font-medium text-foreground underline underline-offset-2">
          {action.label}
        </button>
      )}
    </div>
  );
}

function NoSearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      title="No results found."
      description={`Nothing matched “${query.trim()}”. Try a different keyword.`}
      actionLabel="Clear search"
      onAction={onClear}
    />
  );
}

const LoadingList = () => (
  <ul className="divide-y divide-border" aria-busy="true" aria-label="Loading articles">
    {Array.from({ length: 6 }).map((_, i) => (
      <li key={i} className="py-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
      </li>
    ))}
  </ul>
);

export default Index;
