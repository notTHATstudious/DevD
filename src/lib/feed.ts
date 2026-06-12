import { isValidArticleUrl } from "@/lib/articleUrl";
import { parseRss2JsonResponse } from "@/lib/rss2jsonSchema";

export type Article = {
  title: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: number;
  description: string;
};

// Primary topic keywords. Matched case-insensitively against title+description.
const KEYWORDS: string[] = [
  // Java / JVM
  "java",
  "jvm",
  "jdk",
  "jre",
  "jakarta ee",
  "j2ee",
  "hibernate",
  "maven",
  "gradle",
  // Spring
  "spring boot",
  "springboot",
  "spring-boot",
  "spring framework",
  "spring cloud",
  "spring security",
  "spring data",
  "spring mvc",
  "spring webflux",
  "spring",
  // MongoDB
  "mongodb",
  "mongo db",
  "mongo-db",
  "mongo",
  "mongoose",
  "atlas search",
  // Kafka
  "kafka",
  "apache kafka",
  "kafka streams",
  "kafka connect",
  "confluent",
  "ksqldb",
  // AI tools / assistants / LLMs
  "claude",
  "anthropic",
  "cursor",
  "cursor ai",
  "github copilot",
  "copilot",
  "chatgpt",
  "openai",
  "gpt-4",
  "gpt-5",
  "gemini",
  "llama",
  "ollama",
  "ai tool",
  "ai tools",
  "ai coding",
  "ai assistant",
  "ai agent",
  "llm",
  "llms",
  "generative ai",
  "genai",
];

function hasWord(haystack: string, word: string): boolean {
  // word-boundary match that also treats +, #, -, . as boundaries
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i");
  return re.test(haystack);
}

export function matchesTopics(title: string, description: string): boolean {
  const haystack = `${title} ${description}`.toLowerCase();
  // Avoid "java" matching "javascript"
  if (/\bjava\b(?!script)/i.test(haystack)) return true;
  return KEYWORDS.some((kw) => {
    if (kw === "java") return false; // handled above
    // multi-word phrases: plain substring is fine
    if (kw.includes(" ") || kw.includes("-")) return haystack.includes(kw);
    return hasWord(haystack, kw);
  });
}

export function isWithinDays(ts: number, days: number): boolean {
  const now = Date.now();
  return now - ts <= days * 24 * 60 * 60 * 1000 && ts <= now + 60_000;
}

const FALLBACK_KEYWORDS: string[] = [
  "programming",
  "programmer",
  "developer",
  "development",
  "software",
  "coding",
  "code",
  "engineer",
  "backend",
  "frontend",
  "fullstack",
  "devops",
  "ai",
  "artificial intelligence",
  "machine learning",
  "llm",
  "gpt",
  "chatbot",
];

export function matchesFallbackTopics(title: string, description: string): boolean {
  const haystack = `${title} ${description}`.toLowerCase();
  return FALLBACK_KEYWORDS.some((kw) => {
    if (kw.includes(" ")) return haystack.includes(kw);
    return hasWord(haystack, kw);
  });
}


function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

type FeedSource = { name: string; url: string };

const FEEDS: FeedSource[] = [
  // ---------- Dev.to (tag feeds) ----------
  { name: "Dev.to", url: "https://dev.to/feed/tag/java" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/springboot" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/spring" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/hibernate" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/mongodb" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/kafka" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/ai" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/llm" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/chatgpt" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/claude" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/cursor" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/copilot" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/microservices" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/backend" },
  { name: "Dev.to", url: "https://dev.to/feed/tag/programming" },
  { name: "Dev.to", url: "https://dev.to/feed" }, // site-wide latest

  // ---------- Medium (tag feeds) ----------
  { name: "Medium", url: "https://medium.com/feed/tag/java" },
  { name: "Medium", url: "https://medium.com/feed/tag/spring-boot" },
  { name: "Medium", url: "https://medium.com/feed/tag/spring" },
  { name: "Medium", url: "https://medium.com/feed/tag/hibernate" },
  { name: "Medium", url: "https://medium.com/feed/tag/mongodb" },
  { name: "Medium", url: "https://medium.com/feed/tag/kafka" },
  { name: "Medium", url: "https://medium.com/feed/tag/apache-kafka" },
  { name: "Medium", url: "https://medium.com/feed/tag/microservices" },
  { name: "Medium", url: "https://medium.com/feed/tag/ai" },
  { name: "Medium", url: "https://medium.com/feed/tag/artificial-intelligence" },
  { name: "Medium", url: "https://medium.com/feed/tag/llm" },
  { name: "Medium", url: "https://medium.com/feed/tag/chatgpt" },
  { name: "Medium", url: "https://medium.com/feed/tag/claude" },
  { name: "Medium", url: "https://medium.com/feed/tag/cursor" },
  { name: "Medium", url: "https://medium.com/feed/tag/github-copilot" },
  { name: "Medium", url: "https://medium.com/feed/tag/ai-tools" },
  { name: "Medium", url: "https://medium.com/feed/tag/programming" },
  { name: "Medium", url: "https://medium.com/feed/tag/software-development" },

  // ---------- Reddit (subreddit RSS) ----------
  { name: "Reddit", url: "https://www.reddit.com/r/java/.rss" },
  { name: "Reddit", url: "https://www.reddit.com/r/SpringBoot/.rss" },
  { name: "Reddit", url: "https://www.reddit.com/r/javahelp/.rss" },
  { name: "Reddit", url: "https://www.reddit.com/r/mongodb/.rss" },
  { name: "Reddit", url: "https://www.reddit.com/r/apachekafka/.rss" },
  { name: "Reddit", url: "https://www.reddit.com/r/ClaudeAI/.rss" },
  { name: "Reddit", url: "https://www.reddit.com/r/cursor/.rss" },
  { name: "Reddit", url: "https://www.reddit.com/r/LocalLLaMA/.rss" },
  { name: "Reddit", url: "https://www.reddit.com/r/MachineLearning/.rss" },
  { name: "Reddit", url: "https://www.reddit.com/r/programming/.rss" },

  // ---------- Hacker News (via hnrss.org) ----------
  { name: "Hacker News", url: "https://hnrss.org/newest?q=java+spring" },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=spring+boot" },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=mongodb" },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=kafka" },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=claude+ai" },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=cursor+ai" },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=llm" },

  // ---------- InfoQ ----------
  { name: "InfoQ", url: "https://feed.infoq.com/" },

  // ---------- Baeldung (Java/Spring focused) ----------
  { name: "Baeldung", url: "https://www.baeldung.com/feed/" },

  // ---------- Spring.io blog ----------
  { name: "Spring.io", url: "https://spring.io/blog.atom" },
];

// rss2json returns JSON with CORS headers — far more reliable than a raw proxy.
const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

async function fetchFeed(feed: FeedSource): Promise<Article[]> {
  try {
    const res = await fetch(RSS2JSON + encodeURIComponent(feed.url));
    if (!res.ok) return [];
    const data: unknown = await res.json();
    const parsed = parseRss2JsonResponse(data);
    if (!parsed) return [];

    const articles: Article[] = [];
    for (const it of parsed.items) {
      const title = stripHtml(it.title ?? "");
      const url = (it.link ?? "").trim();
      if (!title || !url || !isValidArticleUrl(url)) continue;

      const publishedAt = it.pubDate ? Date.parse(it.pubDate) : NaN;
      if (!publishedAt || Number.isNaN(publishedAt)) continue;

      const description = stripHtml(it.description ?? it.content ?? "").slice(0, 400);
      const author = it.author?.trim() || undefined;

      articles.push({ title, url, source: feed.name, author, publishedAt, description });
    }
    return articles;
  } catch {
    return [];
  }
}

export type FeedResult = {
  articles: Article[];
  usedFallback: boolean;
};

function dedupeAndSort(list: Article[]): Article[] {
  const seen = new Set<string>();
  const out: Article[] = [];
  for (const a of list) {
    const key = a.url.split("?")[0].replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  out.sort((a, b) => b.publishedAt - a.publishedAt);
  return out;
}

export async function fetchAllArticles(): Promise<FeedResult> {
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const all = results.flat();

  // Primary: strict topic match within last 5 days
  const primary = all.filter(
    (a) => isWithinDays(a.publishedAt, 5) && matchesTopics(a.title, a.description),
  );
  const primaryDeduped = dedupeAndSort(primary);
  if (primaryDeduped.length > 0) {
    return { articles: primaryDeduped, usedFallback: false };
  }

  // Fallback: broader topics within last 15 days
  const fallback = all.filter(
    (a) => isWithinDays(a.publishedAt, 15) && matchesFallbackTopics(a.title, a.description),
  );
  return { articles: dedupeAndSort(fallback), usedFallback: true };
}


export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
