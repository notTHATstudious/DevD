import { describe, it, expect } from "vitest";
import type { Article } from "@/lib/feed";
import type { ReadEntry } from "@/lib/readState";
import { calculateReadingStats } from "@/lib/stats";

describe("calculateReadingStats", () => {
  const now = Date.now();
  
  const articles: Article[] = [
    {
      title: "Java Thread Basics",
      url: "https://example.com/java-thread",
      source: "Dev.to",
      publishedAt: now - 3600000,
      description: "Learn java threads.",
      topics: ["java", "performance"],
    },
    {
      title: "Kubernetes Pod Tutorial",
      url: "https://example.com/k8s-pod",
      source: "CNCF",
      publishedAt: now - 7200000,
      description: "Learn pods.",
      topics: ["kubernetes"],
    },
    {
      title: "MongoDB Indexing Guide",
      url: "https://example.com/mongo-index",
      source: "Dev.to",
      publishedAt: now - 10800000,
      description: "Optimize queries.",
      topics: ["databases", "mongodb"],
    },
  ];

  it("calculates baseline available, read, and unread metrics", () => {
    const readEntries: ReadEntry[] = [
      { url: "https://example.com/java-thread", readAt: now - 1000 },
    ];

    const stats = calculateReadingStats(articles, readEntries, 2, now);

    expect(stats.articlesAvailable).toBe(3);
    expect(stats.articlesRead).toBe(1);
    expect(stats.articlesUnread).toBe(2);
    expect(stats.savedArticlesCount).toBe(2);
  });

  it("calculates today's reading count based on midnight timestamp boundaries", () => {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    const readEntries: ReadEntry[] = [
      // read today
      { url: "https://example.com/java-thread", readAt: startOfTodayMs + 1000 },
      // read yesterday
      { url: "https://example.com/k8s-pod", readAt: startOfTodayMs - 5000 },
    ];

    const stats = calculateReadingStats(articles, readEntries, 0, now);
    expect(stats.todayReadingCount).toBe(1);
  });

  it("determines the top read topic and top source accurately", () => {
    const readEntries: ReadEntry[] = [
      { url: "https://example.com/java-thread", readAt: now },
      { url: "https://example.com/mongo-index", readAt: now },
    ];

    const stats = calculateReadingStats(articles, readEntries, 0, now);

    // Java thread has ["java", "performance"]. Mongo index has ["databases", "mongodb"].
    // Dev.to has 2 read entries (both java-thread and mongo-index are from Dev.to).
    expect(stats.topSource).toBe("Dev.to");
    // All read topics occur once, so topTopic should be one of them (e.g. java, performance, databases, mongodb)
    expect(["java", "performance", "databases", "mongodb"]).toContain(stats.topTopic);
  });
});
