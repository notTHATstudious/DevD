import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, MessageSquare, Minimize2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { searchAssistant } from "@/api/assistant";
import { Article } from "@/lib/feed";
import { useBookmarks } from "@/lib/useBookmarks";
import { useReadState } from "@/lib/useReadState";
import ArticleCard from "@/components/ArticleCard";

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

const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch user state. Since auth dictates the main App's render, if this is null, 
  // the main App will render AuthScreen anyway.
  const user = getCurrentUser();
  
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
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, searchMutation.isPending, isOpen]);

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

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

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[400px] h-[calc(100vh-32px)] sm:h-[600px] max-h-[800px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">DevD Assistant</h2>
            <p className="text-[10px] text-muted-foreground">Always ready to help</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Minimize Assistant"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto bg-background/50 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold tracking-tight">How can I help?</h3>
            <p className="mb-6 max-w-[250px] text-xs text-muted-foreground">
              Search across 100+ curated developer sources.
            </p>
            
            <div className="flex w-full flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs transition hover:bg-muted"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[95%] gap-2 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-1 ${
                      msg.role === "user"
                        ? "bg-muted text-foreground"
                        : "bg-foreground text-background"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-muted text-foreground rounded-tr-sm"
                          : "bg-transparent text-foreground rounded-tl-sm border border-border/50 shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.articles && msg.articles.length > 0 && (
                      <ul className="mt-1 flex flex-col gap-2">
                        {msg.articles.map((article) => (
                          <div key={article.url} className="scale-[0.95] origin-top-left sm:origin-top w-[105%]">
                            <ArticleCard
                              article={article}
                              bookmarked={isBookmarked(article.url)}
                              read={isRead(article.url)}
                              onToggleBookmark={toggleBookmark}
                              onOpenArticle={() => markRead(article.url)}
                            />
                          </div>
                        ))}
                      </ul>
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
          className="relative flex items-center overflow-hidden rounded-full border border-input bg-card shadow-sm focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="w-full bg-transparent py-2.5 pl-4 pr-12 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            disabled={searchMutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || searchMutation.isPending}
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
