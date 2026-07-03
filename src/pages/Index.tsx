import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { type Article } from "@/lib/feed";
import { getCurrentUser, signOut, type DevUser } from "@/lib/auth";
import { filterArticles } from "@/lib/search";
import { filterArticlesByReadState, type ReadFilter } from "@/lib/readState";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBookmarks } from "@/lib/useBookmarks";
import { useReadState } from "@/lib/useReadState";
import { useFeed } from "@/lib/useFeed";
import AuthScreen from "@/components/AuthScreen";
import AppHeader from "@/components/AppHeader";
import ArticleCard from "@/components/ArticleCard";
import {
  TOPICS,
  TOPIC_KEYS,
  getSavedPreferences,
  savePreferences,
  filterByTopicPreferences,
  type TopicKey,
  type TopicPreferences,
} from "@/lib/preferences";
import { sortArticlesByRelevance } from "@/lib/ranking";
import { calculateReadingStats } from "@/lib/stats";

type Tab = "feed" | "saved" | "preferences" | "stats";

const Index = () => {
  const [user, setUser] = useState<DevUser | null>(() => getCurrentUser());
  const [tab, setTab] = useState<Tab>("feed");
  const [searchInput, setSearchInput] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [filterChip, setFilterChip] = useState<string>("all");
  const debouncedQuery = useDebouncedValue(searchInput, 300);

  const [topicPrefs, setTopicPrefs] = useState<TopicPreferences>(getSavedPreferences);

  const {
    data: feedData,
    isPending,
    isRefetching,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useFeed(!!user);

  const articles = feedData?.articles ?? [];
  const isFeedLoading = isPending || isRefetching;
  const isFeedReady = !isFeedLoading && !isError;

  const { bookmarks, count, isBookmarked, toggleBookmark } = useBookmarks(
    user?.username ?? "",
  );

  const { readEntries, isRead, markRead } = useReadState(user?.username ?? "");

  const handleTogglePreference = (key: TopicKey) => {
    const updated = { ...topicPrefs, [key]: !topicPrefs[key] };
    setTopicPrefs(updated);
    savePreferences(updated);
  };

  // 1. Topic preferences filtering
  const topicFilteredArticles = useMemo(() => {
    return filterByTopicPreferences(articles, topicPrefs);
  }, [articles, topicPrefs]);

  const topicFilteredSaved = useMemo(() => {
    return filterByTopicPreferences(bookmarks, topicPrefs);
  }, [bookmarks, topicPrefs]);

  // 2. Relevance Ranking
  const rankedArticles = useMemo(() => {
    const activeTopicKeys = Object.keys(topicPrefs).filter((k) => topicPrefs[k as TopicKey]);
    return sortArticlesByRelevance(topicFilteredArticles, activeTopicKeys);
  }, [topicFilteredArticles, topicPrefs]);

  // 3. Category Filter Chips
  const chipFilteredArticles = useMemo(() => {
    if (filterChip === "all") return rankedArticles;
    return rankedArticles.filter((art) => {
      if (filterChip === "official") return art.isOfficial;
      if (filterChip === "tutorials") return art.isTutorial;
      if (filterChip === "community") return art.isCommunity;
      if (filterChip === "news") return art.isNews;
      
      const artTopics = art.topics || [];
      if (filterChip === "ai") {
        return artTopics.some((t) => ["ai_engineering", "llms", "openai", "anthropic"].includes(t));
      }
      if (filterChip === "cloud") {
        return artTopics.some((t) => ["aws", "azure", "gcp", "cloud_native"].includes(t));
      }
      if (filterChip === "devops") {
        return artTopics.some((t) => ["devops", "ci_cd", "docker", "kubernetes"].includes(t));
      }
      if (filterChip === "backend") {
        return artTopics.some((t) => [
          "java", "spring_boot", "spring_cloud", "kafka", "microservices",
          "databases", "postgresql", "mongodb", "redis", "system_design",
          "backend_engineering", "software_architecture", "performance", "testing"
        ].includes(t));
      }
      return true;
    });
  }, [rankedArticles, filterChip]);

  const chipFilteredSaved = useMemo(() => {
    if (filterChip === "all") return topicFilteredSaved;
    return topicFilteredSaved.filter((art) => {
      if (filterChip === "official") return art.isOfficial;
      if (filterChip === "tutorials") return art.isTutorial;
      if (filterChip === "community") return art.isCommunity;
      if (filterChip === "news") return art.isNews;
      
      const artTopics = art.topics || [];
      if (filterChip === "ai") {
        return artTopics.some((t) => ["ai_engineering", "llms", "openai", "anthropic"].includes(t));
      }
      if (filterChip === "cloud") {
        return artTopics.some((t) => ["aws", "azure", "gcp", "cloud_native"].includes(t));
      }
      if (filterChip === "devops") {
        return artTopics.some((t) => ["devops", "ci_cd", "docker", "kubernetes"].includes(t));
      }
      if (filterChip === "backend") {
        return artTopics.some((t) => [
          "java", "spring_boot", "spring_cloud", "kafka", "microservices",
          "databases", "postgresql", "mongodb", "redis", "system_design",
          "backend_engineering", "software_architecture", "performance", "testing"
        ].includes(t));
      }
      return true;
    });
  }, [topicFilteredSaved, filterChip]);

  // 4. Search and read filter composition
  const searchFilteredFeed = useMemo(
    () => filterArticles(chipFilteredArticles, debouncedQuery),
    [chipFilteredArticles, debouncedQuery],
  );
  const searchFilteredSaved = useMemo(
    () => filterArticles(chipFilteredSaved, debouncedQuery),
    [chipFilteredSaved, debouncedQuery],
  );

  const filteredFeed = useMemo(
    () => filterArticlesByReadState(searchFilteredFeed, readFilter, isRead),
    [searchFilteredFeed, readFilter, isRead],
  );
  const filteredSaved = useMemo(
    () => filterArticlesByReadState(searchFilteredSaved, readFilter, isRead),
    [searchFilteredSaved, readFilter, isRead],
  );

  // 5. Reading statistics
  const stats = useMemo(() => {
    return calculateReadingStats(chipFilteredArticles, readEntries, count, Date.now());
  }, [chipFilteredArticles, readEntries, count]);

  const isSearching = debouncedQuery.trim().length > 0;
  const isReadFiltering = readFilter !== "all" || filterChip !== "all";
  const errorMsg =
    error instanceof Error ? error.message : "Failed to load feed";

  if (!user) {
    return <AuthScreen onAuthed={() => setUser(getCurrentUser())} />;
  }

  const handleSignOut = () => {
    signOut();
    setUser(null);
  };

  const showSearch = (tab === "feed" || tab === "saved") && (tab === "feed" ? isFeedReady && articles.length > 0 : count > 0);
  const showReadFilters = tab === "feed" || tab === "saved";

  const handleOpenArticle = (article: Article) => {
    markRead(article.url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader user={user} onSignOut={handleSignOut} />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {tab === "feed" && "Today's feed"}
            {tab === "saved" && "Saved articles"}
            {tab === "preferences" && "Personalize"}
            {tab === "stats" && "Engagement"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {tab === "feed" && "A curated news platform covering modern technology stacks."}
            {tab === "saved" && "Articles you've bookmarked on this device."}
            {tab === "preferences" && "Manage your tech topic preferences."}
            {tab === "stats" && "Lightweight metrics detailing your reading habits."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-full border border-border p-0.5">
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
              <button
                type="button"
                onClick={() => setTab("preferences")}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  tab === "preferences"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Topics
              </button>
              <button
                type="button"
                onClick={() => setTab("stats")}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  tab === "stats"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Stats
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
                {isFeedReady && !isSearching && !isReadFiltering && (
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {articles.length} total
                  </span>
                )}
                {isFeedReady && (isSearching || isReadFiltering) && (
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {filteredFeed.length} match{filteredFeed.length === 1 ? "" : "es"}
                  </span>
                )}
              </>
            )}

            {tab === "saved" && count > 0 && !isSearching && !isReadFiltering && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {count} saved
              </span>
            )}
            {tab === "saved" && count > 0 && (isSearching || isReadFiltering) && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {filteredSaved.length} match{filteredSaved.length === 1 ? "" : "es"}
              </span>
            )}
          </div>

          {showReadFilters && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="inline-flex rounded-full border border-border p-0.5 w-fit">
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

              <div className="flex flex-wrap gap-1.5 mt-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
                {[
                  { key: "all", label: "All Topics" },
                  { key: "official", label: "Official" },
                  { key: "tutorials", label: "Tutorials" },
                  { key: "community", label: "Community" },
                  { key: "news", label: "News" },
                  { key: "ai", label: "AI" },
                  { key: "cloud", label: "Cloud" },
                  { key: "devops", label: "DevOps" },
                  { key: "backend", label: "Backend" },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setFilterChip(chip.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition shrink-0 ${
                      filterChip === chip.key
                        ? "bg-muted text-foreground border border-foreground font-semibold"
                        : "bg-muted/40 text-muted-foreground border border-border hover:text-foreground"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
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
                  <NoReadFilterResults filter={readFilter} onClear={() => { setReadFilter("all"); setFilterChip("all"); }} />
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
                  <NoReadFilterResults filter={readFilter} onClear={() => { setReadFilter("all"); setFilterChip("all"); }} />
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

          {tab === "preferences" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Topic Preferences</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toggle categories to personalize your feed. Unchecked topics are filtered out.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const updated = { ...topicPrefs };
                      for (const k of TOPIC_KEYS) {
                        updated[k] = true;
                      }
                      setTopicPrefs(updated);
                      savePreferences(updated);
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium transition hover:bg-muted"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...topicPrefs };
                      for (const k of TOPIC_KEYS) {
                        updated[k] = false;
                      }
                      setTopicPrefs(updated);
                      savePreferences(updated);
                    }}
                    className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium transition hover:bg-muted"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPIC_KEYS.map((key) => {
                  const enabled = topicPrefs[key];
                  return (
                    <button
                      key={key}
                      onClick={() => handleTogglePreference(key)}
                      className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition select-none ${
                        enabled
                          ? "bg-foreground/5 border-foreground text-foreground"
                          : "bg-background border-border text-muted-foreground hover:bg-muted/20"
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {TOPICS[key]}
                      </span>
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          enabled
                            ? "bg-foreground border-foreground text-background"
                            : "border-muted-foreground text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "stats" && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold tracking-tight">Reading Stats</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Summary of your engagement metrics and read status.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 bg-muted/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Available</p>
                  <p className="text-2xl font-bold mt-1">{stats.articlesAvailable}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Read</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{stats.articlesRead}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Unread</p>
                  <p className="text-2xl font-bold mt-1">{stats.articlesUnread}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Saved</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{stats.savedArticlesCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 bg-muted/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Read Today</p>
                  <p className="text-lg font-semibold mt-1">🔥 {stats.todayReadingCount} article{stats.todayReadingCount === 1 ? "" : "s"}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/10">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Top Source</p>
                  <p className="text-lg font-semibold mt-1 truncate">📰 {stats.topSource}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/10 sm:col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Top Topic</p>
                  <p className="text-lg font-semibold mt-1 capitalize">💡 {stats.topTopic.replace(/_/g, " ")}</p>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground flex justify-between items-center bg-muted/5 p-3 rounded-lg border border-border">
                <span>Last query update:</span>
                <span className="font-mono">{dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "Never"}</span>
              </div>
            </div>
          )}
        </main>

        <footer className="safe-bottom border-t border-border pt-6 text-[11px] uppercase tracking-widest text-muted-foreground">
          DailyD · Curated Developer News Platform
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
      <p className="text-base font-medium">No matches found for active filters.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Try clearing category chips or read status constraints.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium transition hover:bg-muted"
      >
        Clear filters
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
