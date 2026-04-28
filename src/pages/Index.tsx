import { useEffect, useState } from "react";
import { fetchAllArticles, formatRelativeTime, type Article } from "@/lib/feed";
import { getCurrentUser, signOut, type DevUser } from "@/lib/auth";
import AuthScreen from "@/components/AuthScreen";
import AppHeader from "@/components/AppHeader";

type Status = "loading" | "ready" | "error";

const Index = () => {
  const [user, setUser] = useState<DevUser | null>(() => getCurrentUser());
  const [status, setStatus] = useState<Status>("loading");
  const [articles, setArticles] = useState<Article[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const load = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const { articles } = await fetchAllArticles();
      setArticles(articles);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load feed");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!user) {
    return <AuthScreen onAuthed={() => setUser(getCurrentUser())} />;
  }

  const handleSignOut = () => {
    signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader user={user} onSignOut={handleSignOut} />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Today's feed
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            A minimal daily feed from Dev.to, Medium, Reddit, Hacker News and more.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={load}
              disabled={status === "loading"}
              className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
            >
              {status === "loading" ? "Refreshing…" : "Refresh"}
            </button>
            {status === "ready" && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {articles.length} article{articles.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </section>

        <main className="pb-16">
          {status === "loading" && <LoadingList />}

          {status === "error" && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Something went wrong.</p>
              <p className="mt-1 text-muted-foreground">{errorMsg}</p>
              <button
                onClick={load}
                className="mt-3 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Try again
              </button>
            </div>
          )}

          {status === "ready" && articles.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-base font-medium">No articles found.</p>
            </div>
          )}

          {status === "ready" && articles.length > 0 && (
            <ul className="divide-y divide-border">
              {articles.map((a) => (
                <li key={a.url} className="py-5">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <h2 className="text-lg font-semibold leading-snug tracking-tight group-hover:underline underline-offset-4">
                      {a.title}
                    </h2>
                  </a>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span className="rounded-full border border-border px-2 py-0.5 font-medium text-foreground">
                      {a.source}
                    </span>
                    {a.author && <span className="normal-case tracking-normal">by {a.author}</span>}
                    <span>·</span>
                    <time dateTime={new Date(a.publishedAt).toISOString()} className="normal-case tracking-normal">
                      {formatRelativeTime(a.publishedAt)}
                    </time>
                  </div>
                  {a.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {a.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </main>

        <footer className="safe-bottom border-t border-border pt-6 text-[11px] uppercase tracking-widest text-muted-foreground">
          DailyD · Dev.to · Medium · Reddit · HN · InfoQ · Baeldung
        </footer>
      </div>
    </div>
  );
};

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
