import type { Article } from "@/lib/feed";

const REPUTABLE_AUTHORS = [
  "martin fowler",
  "vlad mihalcea",
  "josh long",
  "troy hunt",
  "corey quinn",
  "yan cui",
  "lilian weng",
  "kent beck",
  "alex xu"
];

/**
 * Calculates a weighted score for an article based on several factors:
 * - isOfficial source: +10
 * - Spring.io domain: +9
 * - Baeldung domain: +8
 * - InfoQ domain: +8
 * - Author reputation: +5
 * - Recent (<24h): +5
 * - Matches active topics in Title: +4 per topic match
 * - Matches active topics in Description: +2 per topic match
 */
export function calculateArticleScore(
  article: Article,
  activeTopics: string[],
  now = Date.now()
): number {
  let score = 0;

  // 1. Official Documentation check
  if (article.isOfficial) {
    score += 10;
  }

  // 2. spring.io domain check
  const urlLower = article.url.toLowerCase();
  if (urlLower.includes("spring.io")) {
    score += 9;
  }

  // 3. baeldung.com domain check
  if (urlLower.includes("baeldung.com")) {
    score += 8;
  }

  // 4. infoq.com domain check
  if (urlLower.includes("infoq.com")) {
    score += 8;
  }

  // 5. Author reputation check
  if (article.author) {
    const authorLower = article.author.toLowerCase();
    const isReputable = REPUTABLE_AUTHORS.some((rep) => authorLower.includes(rep));
    if (isReputable) {
      score += 5;
    }
  }

  // 6. Recency check (<24h)
  const ageMs = now - article.publishedAt;
  if (ageMs > 0 && ageMs < 24 * 60 * 60 * 1000) {
    score += 5;
  }

  // 7. Title / Description keyword match boosts
  const titleLower = article.title.toLowerCase();
  const descLower = article.description.toLowerCase();

  const articleTopics = article.topics || [];
  for (const topic of articleTopics) {
    if (activeTopics.includes(topic)) {
      // Check if topic name matches in title / description
      // Note: We search the lower case text for the topic keyword itself
      const keyword = topic.replace(/_/g, " ");
      if (titleLower.includes(keyword)) {
        score += 4;
      }
      if (descLower.includes(keyword)) {
        score += 2;
      }
    }
  }

  return score;
}

/** Sort articles descending by score, tie-breaker: newest first. */
export function sortArticlesByRelevance(
  articles: Article[],
  activeTopics: string[],
  now = Date.now()
): Article[] {
  const scored = articles.map((article) => ({
    article,
    score: calculateArticleScore(article, activeTopics, now),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.article.publishedAt - a.article.publishedAt;
  });

  return scored.map((s) => s.article);
}
