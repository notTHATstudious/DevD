import { isValidArticleUrl } from "@/lib/articleUrl";
import { parseRss2JsonResponse } from "@/lib/rss2jsonSchema";
import { getMatchedTopics } from "./preferences";

export type Article = {
  title: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: number;
  description: string;
  topics: string[];
  isOfficial?: boolean;
  isTutorial?: boolean;
  isCommunity?: boolean;
  isNews?: boolean;
};

// Primary topic keywords. Matched case-insensitively against title+description.
const KEYWORDS: string[] = [
  "java", "jvm", "jdk", "jre", "jakarta ee", "j2ee", "hibernate", "maven", "gradle",
  "spring boot", "springboot", "spring-boot", "spring framework", "spring cloud",
  "spring security", "spring data", "spring mvc", "spring webflux", "spring",
  "mongodb", "mongo db", "mongo-db", "mongo", "mongoose", "atlas search",
  "kafka", "apache kafka", "kafka streams", "kafka connect", "confluent", "ksqldb",
  "claude", "anthropic", "cursor", "cursor ai", "github copilot", "copilot", "chatgpt",
  "openai", "gpt-4", "gpt-5", "gemini", "llama", "ollama", "ai tool", "ai tools",
  "ai coding", "ai assistant", "ai agent", "llm", "llms", "generative ai", "genai"
];

function hasWord(haystack: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i");
  return re.test(haystack);
}

export function matchesTopics(title: string, description: string): boolean {
  const haystack = `${title} ${description}`.toLowerCase();
  if (/\bjava\b(?!script)/i.test(haystack)) return true;
  return KEYWORDS.some((kw) => {
    if (kw === "java") return false;
    if (kw.includes(" ") || kw.includes("-")) return haystack.includes(kw);
    return hasWord(haystack, kw);
  });
}

export function isWithinDays(ts: number, days: number): boolean {
  const now = Date.now();
  return now - ts <= days * 24 * 60 * 60 * 1000 && ts <= now + 60_000;
}

const FALLBACK_KEYWORDS: string[] = [
  "programming", "programmer", "developer", "development", "software", "coding", "code",
  "engineer", "backend", "frontend", "fullstack", "devops", "ai", "artificial intelligence",
  "machine learning", "llm", "gpt", "chatbot"
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

export type FeedSource = {
  name: string;
  url: string;
  isOfficial?: boolean;
  isTutorial?: boolean;
  isCommunity?: boolean;
  isNews?: boolean;
};

const FEEDS: FeedSource[] = [
  // ---------- Dev.to (tag feeds) ----------
  { name: "Dev.to", url: "https://dev.to/feed/tag/java", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/springboot", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/spring", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/hibernate", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/mongodb", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/kafka", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/ai", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/llm", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/chatgpt", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/claude", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/cursor", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/copilot", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/microservices", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/backend", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/programming", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/devops", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/docker", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/kubernetes", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/aws", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/security", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed/tag/testing", isCommunity: true },
  { name: "Dev.to", url: "https://dev.to/feed", isCommunity: true },

  // ---------- Medium (tag feeds) ----------
  { name: "Medium", url: "https://medium.com/feed/tag/java", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/spring-boot", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/spring", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/hibernate", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/mongodb", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/kafka", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/apache-kafka", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/microservices", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/ai", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/artificial-intelligence", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/llm", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/chatgpt", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/claude", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/cursor", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/github-copilot", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/ai-tools", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/programming", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/software-development", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/devops", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/docker", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/kubernetes", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/aws", isCommunity: true },
  { name: "Medium", url: "https://medium.com/feed/tag/security", isCommunity: true },

  // ---------- Reddit (subreddit RSS) ----------
  { name: "Reddit", url: "https://www.reddit.com/r/java/.rss", isCommunity: true },
  { name: "Reddit", url: "https://www.reddit.com/r/SpringBoot/.rss", isCommunity: true },
  { name: "Reddit", url: "https://www.reddit.com/r/javahelp/.rss", isCommunity: true },
  { name: "Reddit", url: "https://www.reddit.com/r/mongodb/.rss", isCommunity: true },
  { name: "Reddit", url: "https://www.reddit.com/r/apachekafka/.rss", isCommunity: true },
  { name: "Reddit", url: "https://www.reddit.com/r/ClaudeAI/.rss", isCommunity: true },
  { name: "Reddit", url: "https://www.reddit.com/r/cursor/.rss", isCommunity: true },
  { name: "Reddit", url: "https://www.reddit.com/r/LocalLLaMA/.rss", isCommunity: true },
  { name: "Reddit", url: "https://www.reddit.com/r/MachineLearning/.rss", isCommunity: true },
  { name: "Reddit", url: "https://www.reddit.com/r/programming/.rss", isCommunity: true },

  // ---------- Hacker News (via hnrss.org) ----------
  { name: "Hacker News", url: "https://hnrss.org/newest?q=java+spring", isNews: true },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=spring+boot", isNews: true },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=mongodb", isNews: true },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=kafka", isNews: true },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=claude+ai", isNews: true },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=cursor+ai", isNews: true },
  { name: "Hacker News", url: "https://hnrss.org/newest?q=llm", isNews: true },

  // ---------- InfoQ ----------
  { name: "InfoQ", url: "https://feed.infoq.com/", isNews: true },

  // ---------- Baeldung (Java/Spring focused) ----------
  { name: "Baeldung", url: "https://www.baeldung.com/feed/", isTutorial: true },

  // ---------- Spring.io blog ----------
  { name: "Spring.io", url: "https://spring.io/blog.atom", isOfficial: true },

  // ---------- Java Official Blogs ----------
  { name: "Inside Java", url: "https://inside.java/feed.xml", isOfficial: true },
  { name: "Oracle Java Blog", url: "https://blogs.oracle.com/java/rss", isOfficial: true },
  { name: "Java Code Geeks", url: "https://feeds.feedburner.com/JavaCodeGeeks", isTutorial: true },
  { name: "Reflectoring.io", url: "https://reflectoring.io/index.xml", isTutorial: true },
  { name: "Maciej Walkowiak", url: "https://maciejwalkowiak.com/feed.xml", isTutorial: true },
  { name: "Piotr's TechBlog", url: "https://piotrminkowski.com/feed/", isTutorial: true },
  { name: "Thorben Janssen", url: "https://thorben-janssen.com/feed/", isTutorial: true },

  // ---------- Kafka & System Design Blogs ----------
  { name: "Confluent Blog", url: "https://www.confluent.io/blog/feed/", isOfficial: true },
  { name: "Jack Vanlightly", url: "https://jack-vanlightly.com/blog?format=rss", isOfficial: true },

  // ---------- DevOps & Cloud Blogs ----------
  { name: "Docker Blog", url: "https://www.docker.com/blog/feed/", isOfficial: true },
  { name: "Kubernetes Blog", url: "https://kubernetes.io/feed.xml", isOfficial: true },
  { name: "CNCF Blog", url: "https://www.cncf.io/feed/", isOfficial: true },
  { name: "Learnk8s", url: "https://learnk8s.io/feed.xml", isTutorial: true },
  { name: "Giant Swarm", url: "https://www.giantswarm.io/blog/rss.xml", isOfficial: true },
  { name: "Sysdig Blog", url: "https://sysdig.com/blog/feed/", isNews: true },
  { name: "AWS News Blog", url: "https://aws.amazon.com/blogs/aws/feed/", isOfficial: true, isNews: true },
  { name: "AWS Architecture", url: "https://aws.amazon.com/blogs/architecture/feed/", isOfficial: true },
  { name: "AWS DevOps Blog", url: "https://aws.amazon.com/blogs/devops/feed/", isOfficial: true },
  { name: "AWS Security Blog", url: "https://aws.amazon.com/blogs/security/feed/", isOfficial: true },
  { name: "The Burning Monk", url: "https://theburningmonk.com/feed/", isTutorial: true },
  { name: "Last Week in AWS", url: "https://www.lastweekinaws.com/feed/", isNews: true },
  { name: "Azure Blog", url: "https://azure.microsoft.com/en-us/blog/feed/", isOfficial: true },
  { name: "Microsoft DevOps", url: "https://devblogs.microsoft.com/devops/feed/", isOfficial: true },
  { name: "Azure Architecture", url: "https://azure.microsoft.com/en-us/blog/topics/architecture/feed/", isOfficial: true },
  { name: "Google Cloud Blog", url: "https://cloud.google.com/blog/rss", isOfficial: true },
  { name: "GCP Solutions Blog", url: "https://cloud.google.com/blog/products/gcp/rss", isOfficial: true },
  { name: "HashiCorp Blog", url: "https://www.hashicorp.com/blog/feed.xml", isOfficial: true },
  { name: "SRE Weekly", url: "https://sreweekly.com/feed/", isNews: true },
  { name: "Spacelift", url: "https://spacelift.io/blog/rss.xml", isTutorial: true },

  // ---------- Database Blogs ----------
  { name: "MongoDB Eng Blog", url: "https://www.mongodb.com/blog/post/channel/engineering/feed/", isOfficial: true },
  { name: "PostgreSQL Weekly", url: "https://postgresweekly.com/rss/", isNews: true },
  { name: "Redis Blog", url: "https://redis.io/blog/feed/", isOfficial: true },
  { name: "Cockroach Labs", url: "https://www.cockroachlabs.com/blog/index.xml", isOfficial: true },

  // ---------- AI & LLM Blogs ----------
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", isOfficial: true },
  { name: "Anthropic Blog", url: "https://www.anthropic.com/news.xml", isOfficial: true },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", isTutorial: true },
  { name: "Google AI Blog", url: "https://feeds.feedburner.com/blogspot/gtai", isOfficial: true },
  { name: "Lilian Weng", url: "https://lilianweng.github.io/index.xml", isTutorial: true },

  // ---------- Architecture & General Engineering Blogs ----------
  { name: "Netflix Tech Blog", url: "https://netflixtechblog.com/feed", isOfficial: true },
  { name: "Uber Eng Blog", url: "https://www.uber.com/blog/engineering/rss/", isOfficial: true },
  { name: "GitHub Engineering", url: "https://github.blog/category/engineering/feed/", isOfficial: true },
  { name: "Discord Eng Blog", url: "https://discord.com/blog/rss.xml", isOfficial: true },
  { name: "ByteByteGo", url: "https://blog.bytebytego.com/feed", isTutorial: true },
  { name: "Martin Fowler", url: "https://martinfowler.com/feed.xml", isOfficial: true },

  // ---------- Security & Software Quality Blogs ----------
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", isNews: true },
  { name: "Troy Hunt", url: "https://www.troyhunt.com/feed/", isTutorial: true },
  { name: "PortSwigger Blog", url: "https://portswigger.net/blog/rss", isNews: true },
  { name: "Kent Beck", url: "https://tidyfirst.substack.com/feed", isTutorial: true },
];

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
      const topics = getMatchedTopics(title, description);

      articles.push({
        title,
        url,
        source: feed.name,
        author,
        publishedAt,
        description,
        topics,
        isOfficial: feed.isOfficial,
        isTutorial: feed.isTutorial,
        isCommunity: feed.isCommunity,
        isNews: feed.isNews,
      });
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
  const deduped = dedupeAndSort(all);

  // Return full deduped corpus. In-memory components will handle preferences, scoring and category tabs.
  return { articles: deduped, usedFallback: false };
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
