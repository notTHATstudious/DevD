import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, MessageSquare, Minimize2, RotateCcw, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { ASSISTANT_PAGE_SIZE, searchAssistant } from "@/api/assistant";
import { Article } from "@/lib/feed";
import { useBookmarks } from "@/lib/useBookmarks";
import { useReadState } from "@/lib/useReadState";
import ArticleCard from "@/components/ArticleCard";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** The query this answer is for (used to load more results). */
  query?: string;
  articles?: Article[];
  total?: number;
  didYouMean?: string | null;
  suggestions?: string[];
  loadingMore?: boolean;
};

/** Starter prompts; they also show off time and type filters. */
const STARTERS = [
  "iPhone news this week",
  "Kubernetes tutorials",
  "Official Spring Boot",
  "Best laptop",
  "LLM news today",
  "Kafka consumer groups",
];

const chip =
  "rounded-full border border-border bg-card px-3 py-1 text-xs transition hover:bg-muted disabled:opacity-50";

let nextId = 0;
const newId = () => `${Date.now()}-${nextId++}`;

const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shared stores: bookmarking here updates the feed and Saved tab immediately.
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { isRead, markRead } = useReadState();

  const searchMutation = useMutation({
    mutationFn: (query: string) => searchAssistant({ query }),
    onSuccess: (data, query) => {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: data.summary,
          query: data.didYouMean || query,
          articles: data.articles,
          total: data.total,
          didYouMean: data.didYouMean,
          suggestions: data.suggestions,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: "Sorry, I couldn't reach the search service. Please try again in a moment.",
        },
      ]);
    },
  });

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, searchMutation.isPending, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleSend = (query: string) => {
    const q = query.trim();
    if (!q || searchMutation.isPending) return;
    setMessages((prev) => [...prev, { id: newId(), role: "user", content: q }]);
    setInput("");
    searchMutation.mutate(q);
  };

  const updateMessage = (id: string, patch: (m: Message) => Partial<Message>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch(m) } : m)));

  const loadMore = async (msg: Message) => {
    if (!msg.query || msg.loadingMore) return;
    updateMessage(msg.id, () => ({ loadingMore: true }));
    try {
      const data = await searchAssistant({
        query: msg.query,
        offset: msg.articles?.length ?? 0,
        limit: ASSISTANT_PAGE_SIZE,
      });
      updateMessage(msg.id, (m) => {
        const seen = new Set((m.articles ?? []).map((a) => a.url));
        return {
          loadingMore: false,
          articles: [...(m.articles ?? []), ...data.articles.filter((a) => !seen.has(a.url))],
          total: data.total,
        };
      });
    } catch {
      updateMessage(msg.id, () => ({ loadingMore: false }));
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition hover:scale-105 active:scale-95"
        aria-label="Open Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div
      role="dialog"
      aria-label="DevD Assistant"
      className="fixed bottom-4 right-4 z-50 flex h-[calc(100dvh-32px)] max-h-[800px] w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:bottom-6 sm:right-6 sm:h-[640px] sm:w-[420px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">DevD Assistant</h2>
            <p className="text-[10px] text-muted-foreground">Searches 120+ dev, big tech & gadget sources</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="New search"
              title="New search"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Minimize Assistant"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto bg-background/50 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold tracking-tight">What do you want to read about?</h3>
            <p className="mb-5 max-w-[280px] text-xs text-muted-foreground">
              Search any tech topic. Add “today”, “this week”, “official” or “tutorials” to narrow it
              down. Typos and short names like k8s are fine.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => handleSend(s)} className={chip}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[95%] gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user" ? "bg-muted text-foreground" : "bg-foreground text-background"
                    }`}
                  >
                    {msg.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "rounded-tr-sm bg-muted text-foreground"
                          : "rounded-tl-sm border border-border/50 bg-transparent text-foreground shadow-sm"
                      }`}
                    >
                      {msg.didYouMean && (
                        <p className="mb-1 text-xs text-muted-foreground">
                          Showing results for <span className="font-semibold text-foreground">{msg.didYouMean}</span>
                        </p>
                      )}
                      {msg.content}
                    </div>

                    {msg.articles && msg.articles.length > 0 && (
                      <ul className="flex flex-col divide-y divide-border">
                        {msg.articles.map((article) => (
                          <ArticleCard
                            key={article.url}
                            article={article}
                            bookmarked={isBookmarked(article.url)}
                            read={isRead(article.url)}
                            onToggleBookmark={toggleBookmark}
                            onOpenArticle={() => markRead(article.url)}
                          />
                        ))}
                      </ul>
                    )}

                    {msg.articles && msg.total !== undefined && msg.articles.length < msg.total && (
                      <button
                        onClick={() => loadMore(msg)}
                        disabled={msg.loadingMore}
                        className={`${chip} self-start`}
                      >
                        {msg.loadingMore ? "Loading…" : `Show more (${msg.total - msg.articles.length} left)`}
                      </button>
                    )}

                    {msg === lastAssistant && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="w-full text-[10px] uppercase tracking-wider text-muted-foreground">
                          Related searches
                        </span>
                        {msg.suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSend(s)}
                            disabled={searchMutation.isPending}
                            className={`${chip} capitalize`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {searchMutation.isPending && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%] gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Bot className="h-3 w-3" />
                  </div>
                  <div className="flex items-center rounded-2xl border border-border/50 px-4 py-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} className="h-px w-full" />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background p-3">
        <form
          onSubmit={onSubmit}
          className="relative flex items-center overflow-hidden rounded-full border border-input bg-card shadow-sm transition-colors focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Pixel news this week, k8s tutorials…"
            maxLength={200}
            aria-label="Search query"
            className="w-full bg-transparent py-2.5 pl-4 pr-12 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            disabled={searchMutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || searchMutation.isPending}
            aria-label="Send"
            className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition hover:bg-foreground/90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default FloatingAssistant;
