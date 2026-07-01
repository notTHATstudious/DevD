import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { type Article } from "@/lib/feed";
import { getCurrentUser, signOut, type DevUser } from "@/lib/auth";
import { type BookmarkedArticle } from "@/lib/bookmarks";
import { filterArticles } from "@/lib/search";
import { filterArticlesByReadState, type ReadFilter } from "@/lib/readState";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBookmarks } from "@/lib/useBookmarks";
import { useReadState } from "@/lib/useReadState";
import { useFeed } from "@/lib/useFeed";
import AuthScreen from "@/components/AuthScreen";
import AppHeader from "@/components/AppHeader";
import ArticleCard from "@/components/ArticleCard";

type Tab = "feed" | "saved";

const Index = () => {
  const [user, setUser] = useState<DevUser | null>(() => getCurrentUser());
  const [tab, setTab] = useState<Tab>("feed");
  const [searchInput, setSearchInput] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const debouncedQuery = useDebouncedValue(searchInput, 300);

  const {
    data: feedData,
    isPending,
    isRefetching,
    isError,
    error,
    refetch,
  } = useFeed(!!user);

  const articles = feedData?.articles ?? [];
  const isFeedLoading = isPending || isRefetching;
  const isFeedReady = !isFeedLoading && !isError;

  const { bookmarks, count, isBookmarked, toggleBookmark } = useBookmarks(
    user?.username ?? "",
  );

  const { isRead, markRead } = useReadState(user?.username ?? "");

  const searchFilteredFeed = useMemo(
    () => filterArticles(articles, debouncedQuery),
    [articles, debouncedQuery],
  );
  const searchFilteredSaved = useMemo(
    () => filterArticles(bookmarks, debouncedQuery),
    [bookmarks, debouncedQuery],
  );

  const filteredFeed = useMemo(
    () => filterArticlesByReadState(searchFilteredFeed, readFilter, isRead),
    [searchFilteredFeed, readFilter, isRead],
  );
  const filteredSaved = useMemo(
    () => filterArticlesByReadState(searchFilteredSaved, readFilter, isRead),
    [searchFilteredSaved, readFilter, isRead],
  );

  const isSearching = debouncedQuery.trim().length > 0;
  const isReadFiltering = readFilter !== "all";
  const errorMsg =
    error instanceof Error ? error.message : "Failed to load feed";

  if (!user) {
    return <AuthScreen onAuthed={() => setUser(getCurrentUser())} />;
  }

  const handleSignOut = () => {
    signOut();
    setUser(null);
  };

  const showSearch = tab === "feed" ? isFeedReady && articles.length > 0 : count > 0;
  const showReadFilters = showSearch;

  const handleOpenArticle = (article: Article) => {
    markRead(article.url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader user={user} onSignOut={handleSignOut} />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {tab === "feed" ? "Today's feed" : "Saved articles"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {tab === "feed"
              ? "A minimal daily feed from Dev.to, Medium, Reddit, Hacker News and more."
              : "Articles you've bookmarked on this device."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-border p-0.5">
              <button
                type="button"
                onClick={() => setTab("feed")}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  tab === "feed"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Feed
              </button>
              <button
                type="button"
                onClick={() => setTab("saved")}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  tab === "saved"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Saved
                {count > 0 && (
                  <span
                    className={`ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                      tab === "saved"
                        ? "bg-background text-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            </div>

            {tab === "feed" && (
              <>
                <button
                  onClick={() => refetch()}
                  disabled={isFeedLoading}
                  className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
                >
                  {isFeedLoading ? "Refreshing…" : "Refresh"}
                </button>
                {isFeedReady && !isSearching && (
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {articles.length} article{articles.length === 1 ? "" : "s"}
                  </span>
                )}
                {isFeedReady && (isSearching || isReadFiltering) && (
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {filteredFeed.length} result{filteredFeed.length === 1 ? "" : "s"}
                  </span>
                )}
              </>
            )}

            {tab === "saved" && count > 0 && !isSearching && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {count} saved
              </span>
            )}
            {tab === "saved" && count > 0 && (isSearching || isReadFiltering) && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {filteredSaved.length} result{filteredSaved.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {showReadFilters && (
            <div className="mt-3 inline-flex rounded-full border border-border p-0.5">
              {(["all", "unread", "read"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setReadFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                    readFilter === f
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {showSearch && (
            <div className="relative mt-4">
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
        </section>

        <main className="pb-16">
          {tab === "feed" && (
            <>
              {isFeedLoading && <LoadingList />}

              {isError && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                  <p className="font-medium">Something went wrong.</p>
                  <p className="mt-1 text-muted-foreground">{errorMsg}</p>
                  <button
                    onClick={() => refetch()}
                    className="mt-3 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Try again
                  </button>
                </div>
              )}

              {isFeedReady && articles.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-10 text-center">
                  <p className="text-base font-medium">No articles found.</p>
                </div>
              )}

              {isFeedReady && articles.length > 0 && searchFilteredFeed.length === 0 && (
                <NoSearchResults query={debouncedQuery} onClear={() => setSearchInput("")} />
              )}

              {isFeedReady &&
                searchFilteredFeed.length > 0 &&
                filteredFeed.length === 0 &&
                isReadFiltering && (
                  <NoReadFilterResults filter={readFilter} onClear={() => setReadFilter("all")} />
                )}

              {isFeedReady && filteredFeed.length > 0 && (
                <ArticleList
                  items={filteredFeed}
                  isBookmarked={isBookmarked}
                  isRead={isRead}
                  onToggleBookmark={toggleBookmark}
                  onOpenArticle={handleOpenArticle}
                />
              )}
            </>
          )}

          {tab === "saved" && (
            <>
              {count === 0 && (
                <div className="rounded-xl border border-dashed border-border p-10 text-center">
                  <p className="text-base font-medium">No saved articles yet.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tap the bookmark icon on any article in your feed to save it here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("feed")}
                    className="mt-4 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium transition hover:bg-muted"
                  >
                    Browse feed
                  </button>
                </div>
              )}

              {count > 0 && searchFilteredSaved.length === 0 && (
                <NoSearchResults query={debouncedQuery} onClear={() => setSearchInput("")} />
              )}

              {count > 0 &&
                searchFilteredSaved.length > 0 &&
                filteredSaved.length === 0 &&
                isReadFiltering && (
                  <NoReadFilterResults filter={readFilter} onClear={() => setReadFilter("all")} />
                )}

              {count > 0 && filteredSaved.length > 0 && (
                <ArticleList
                  items={filteredSaved}
                  isBookmarked={isBookmarked}
                  isRead={isRead}
                  onToggleBookmark={toggleBookmark}
                  onOpenArticle={handleOpenArticle}
                  showSavedAt
                />
              )}
            </>
          )}
        </main>

        <footer className="safe-bottom border-t border-border pt-6 text-[11px] uppercase tracking-widest text-muted-foreground">
          DailyD · Dev.to · Medium · Reddit · HN · InfoQ · Baeldung
        </footer>
      </div>
    </div>
  );
};

type ArticleListProps = {
  items: Article[];
  isBookmarked: (url: string) => boolean;
  isRead: (url: string) => boolean;
  onToggleBookmark: (article: Article) => void;
  onOpenArticle: (article: Article) => void;
  showSavedAt?: boolean;
};

function ArticleList({
  items,
  isBookmarked,
  isRead,
  onToggleBookmark,
  onOpenArticle,
  showSavedAt,
}: ArticleListProps) {
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => (
        <ArticleCard
          key={a.url}
          article={a}
          bookmarked={isBookmarked(a.url)}
          read={isRead(a.url)}
          savedAt={showSavedAt ? (a as BookmarkedArticle).savedAt : undefined}
          onToggleBookmark={onToggleBookmark}
          onOpenArticle={onOpenArticle}
        />
      ))}
    </ul>
  );
}

function NoReadFilterResults({
  filter,
  onClear,
}: {
  filter: ReadFilter;
  onClear: () => void;
}) {
  const label = filter === "read" ? "read" : "unread";
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-base font-medium">No {label} articles.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Try switching filters or open some articles from your feed.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium transition hover:bg-muted"
      >
        Show all
      </button>
    </div>
  );
}

function NoSearchResults({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-base font-medium">No results found.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Nothing matched &ldquo;{query.trim()}&rdquo;. Try a different keyword.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium transition hover:bg-muted"
      >
        Clear search
      </button>
    </div>
  );
}

const LoadingList = () => (
  <ul className="divide-y divide-border">
    {Array.from({ length: 5 }).map((_, i) => (
      <li key={i} className="py-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
      </li>
    ))}
  </ul>
);

export default Index;
