import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { getCurrentUser, signOut, type DevUser } from "@/lib/auth";
import { searchAssistant } from "@/api/assistant";
import { Article } from "@/lib/feed";
import { useBookmarks } from "@/lib/useBookmarks";
import { useReadState } from "@/lib/useReadState";
import AppHeader from "@/components/AppHeader";
import ArticleCard from "@/components/ArticleCard";
import AuthScreen from "@/components/AuthScreen";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  articles?: Article[];
};

const SUGGESTIONS = [
  "Spring Boot 4",
  "Kafka Consumer Groups",
  "Docker Networking",
  "Kubernetes Ingress",
  "Java Virtual Threads",
];

const DevDAssistant = () => {
  const [user, setUser] = useState<DevUser | null>(() => getCurrentUser());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isBookmarked, toggleBookmark } = useBookmarks(user?.username ?? "");
  const { isRead, markRead } = useReadState(user?.username ?? "");

  const searchMutation = useMutation({
    mutationFn: searchAssistant,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.summary,
          articles: data.articles,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I couldn't reach the search service. Please try again later.",
        },
      ]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, searchMutation.isPending]);

  if (!user) {
    return <AuthScreen onAuthed={() => setUser(getCurrentUser())} />;
  }

  const handleSignOut = () => {
    signOut();
    setUser(null);
  };

  const handleSend = (query: string) => {
    if (!query.trim() || searchMutation.isPending) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: query },
    ]);
    setInput("");
    searchMutation.mutate(query);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <AppHeader user={user} onSignOut={handleSignOut} />

      {/* Main chat area */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {messages.length === 0 ? (
            <div className="mt-12 flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background">
                <Bot className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                DevD Assistant
              </h1>
              <p className="mb-8 max-w-md text-sm text-muted-foreground">
                Search across 100+ curated developer sources.
              </p>
              
              <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="rounded-xl border border-border bg-card p-4 text-left text-sm transition hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[95%] gap-4 sm:max-w-[85%] ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.role === "user"
                          ? "bg-muted text-foreground"
                          : "bg-foreground text-background"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col gap-2">
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-muted text-foreground"
                            : "bg-transparent text-foreground"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.articles && msg.articles.length > 0 && (
                        <ul className="mt-2 flex flex-col divide-y divide-border rounded-xl border border-border bg-card px-2">
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
                    </div>
                  </div>
                </div>
              ))}
              
              {searchMutation.isPending && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%] gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} className="h-px w-full" />
            </div>
          )}
        </div>
      </main>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 p-4 backdrop-blur-md safe-bottom">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={onSubmit}
            className="relative flex items-center overflow-hidden rounded-full border border-input bg-background shadow-sm focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground transition-colors"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a developer topic..."
              className="w-full bg-transparent py-3.5 pl-5 pr-14 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
              disabled={searchMutation.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || searchMutation.isPending}
              className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition hover:bg-foreground/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            DevD Assistant searches across existing curated articles.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevDAssistant;
