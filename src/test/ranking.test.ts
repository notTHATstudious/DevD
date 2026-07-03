import { describe, it, expect } from "vitest";
import type { Article } from "@/lib/feed";
import { calculateArticleScore, sortArticlesByRelevance } from "@/lib/ranking";

describe("calculateArticleScore", () => {
  const baseArticle: Article = {
    title: "Intro to Containers",
    url: "https://example.com/containers",
    source: "Dev.to",
    publishedAt: Date.now() - 36 * 60 * 60 * 1000, // 36 hours ago (old)
    description: "Learn Docker and basic containment.",
    topics: ["docker"],
  };

  it("calculates basic score of 0 when no boosts apply", () => {
    const score = calculateArticleScore(baseArticle, ["java"], Date.now());
    expect(score).toBe(0);
  });

  it("adds +10 for official documentation feeds", () => {
    const art = { ...baseArticle, isOfficial: true };
    const score = calculateArticleScore(art, ["java"], Date.now());
    expect(score).toBe(10);
  });

  it("adds +9 for spring.io urls", () => {
    const art = { ...baseArticle, url: "https://spring.io/blog/virt-threads" };
    const score = calculateArticleScore(art, ["java"], Date.now());
    expect(score).toBe(9);
  });

  it("adds +8 for Baeldung urls", () => {
    const art = { ...baseArticle, url: "https://www.baeldung.com/spring-boot" };
    const score = calculateArticleScore(art, ["java"], Date.now());
    expect(score).toBe(8);
  });

  it("adds +8 for InfoQ urls", () => {
    const art = { ...baseArticle, url: "https://www.infoq.com/news/java-21" };
    const score = calculateArticleScore(art, ["java"], Date.now());
    expect(score).toBe(8);
  });

  it("adds +5 for reputable authors", () => {
    const art = { ...baseArticle, author: "Martin Fowler" };
    const score = calculateArticleScore(art, ["java"], Date.now());
    expect(score).toBe(5);
  });

  it("adds +5 for articles published within last 24 hours", () => {
    const art = { ...baseArticle, publishedAt: Date.now() - 5 * 60 * 60 * 1000 }; // 5 hours ago
    const score = calculateArticleScore(art, ["java"], Date.now());
    expect(score).toBe(5);
  });

  it("adds +4 for matches in title and +2 for matches in description", () => {
    const art = {
      ...baseArticle,
      title: "Learning Docker Today",
      description: "Docker is very popular.",
      topics: ["docker"],
    };
    // If docker is in active topics
    const score = calculateArticleScore(art, ["docker"], Date.now());
    // title contains "docker" -> +4. description contains "docker" -> +2. Total = 6
    expect(score).toBe(6);
  });
});

describe("sortArticlesByRelevance", () => {
  const now = Date.now();
  const articles: Article[] = [
    {
      title: "Spring Boot tutorial",
      url: "https://example.com/1",
      source: "Medium",
      publishedAt: now - 1000,
      description: "Sample desc.",
      topics: ["spring_boot"],
    },
    {
      title: "Official Spring Security announcement",
      url: "https://spring.io/blog/sec",
      source: "Spring.io",
      publishedAt: now - 5000,
      description: "Sample desc.",
      topics: ["spring_boot"],
      isOfficial: true,
    },
    {
      title: "Another Java article",
      url: "https://example.com/3",
      source: "Dev.to",
      publishedAt: now - 500,
      description: "Sample desc.",
      topics: ["java"],
    },
  ];

  it("sorts by relevance score descending", () => {
    // spring.io article has: Official (+10) + spring.io (+9) + Recency (+5) = 24 points
    // spring boot tutorial article has: Recency (+5) = 5 points
    // another java article has: Recency (+5) = 5 points (but newer)
    const sorted = sortArticlesByRelevance(articles, ["spring_boot", "java"], now);
    
    expect(sorted[0].source).toBe("Spring.io"); // highest score (24)
    expect(sorted[1].title).toBe("Another Java article"); // tie breaker (newest first, now-500 > now-1000)
    expect(sorted[2].title).toBe("Spring Boot tutorial");
  });
});
