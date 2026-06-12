import type { Article } from "@/lib/feed";

function searchableText(article: Article): string {
  return [article.title, article.description, article.source, article.author ?? ""]
    .join(" ")
    .toLowerCase();
}

/** Returns true when query is empty or every term appears in title, description, source, or author. */
export function articleMatchesQuery(article: Article, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = searchableText(article);
  return terms.every((term) => haystack.includes(term));
}

export function filterArticles<T extends Article>(articles: T[], query: string): T[] {
  const terms = query.trim();
  if (!terms) return articles;
  return articles.filter((article) => articleMatchesQuery(article, query));
}
