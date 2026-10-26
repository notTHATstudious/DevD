import type { Article } from "@/lib/feed";

/** Short names people type → words that appear in articles. */
const SYNONYMS: Record<string, string[]> = {
  k8s: ["kubernetes"],
  kubernetes: ["k8s"],
  js: ["javascript"],
  ts: ["typescript"],
  postgres: ["postgresql"],
  mongo: ["mongodb"],
  gpt: ["openai", "chatgpt"],
  chatgpt: ["openai", "gpt"],
  claude: ["anthropic"],
  llm: ["llms"],
  ai: ["llm", "llms", "genai"],
  mac: ["macbook", "macos"],
  phone: ["phones", "smartphone", "smartphones", "iphone", "pixel", "galaxy"],
  laptop: ["laptops", "macbook", "chromebook", "thinkpad"],
  gpu: ["gpus", "nvidia"],
  springboot: ["spring"],
};

const WORD_RE = /[a-z0-9+#]+/g;

// Articles are immutable once loaded, so their word lists can be cached.
const wordCache = new WeakMap<Article, string[]>();

function articleWords(article: Article): string[] {
  let words = wordCache.get(article);
  if (!words) {
    const text = [
      article.title,
      article.description,
      article.source,
      article.author ?? "",
      (article.topics ?? []).join(" ").replace(/_/g, " "),
    ]
      .join(" ")
      .toLowerCase();
    words = Array.from(new Set(text.match(WORD_RE) ?? []));
    wordCache.set(article, words);
  }
  return words;
}

function queryTerms(query: string): string[] {
  return query.toLowerCase().match(WORD_RE) ?? [];
}

/**
 * A term matches when some word in the article starts with it, so "kube"
 * finds Kubernetes but "ai" no longer matches "said" or "maintain".
 */
function termMatches(words: string[], term: string): boolean {
  const options = [term, ...(SYNONYMS[term] ?? [])];
  return options.some((opt) => words.some((w) => w.startsWith(opt)));
}

/** True when the query is empty or every term matches title, description, source, author or topics. */
export function articleMatchesQuery(article: Article, query: string): boolean {
  const terms = queryTerms(query);
  if (terms.length === 0) return true;
  const words = articleWords(article);
  return terms.every((term) => termMatches(words, term));
}

export function filterArticles<T extends Article>(articles: T[], query: string): T[] {
  if (queryTerms(query).length === 0) return articles;
  return articles.filter((article) => articleMatchesQuery(article, query));
}
