import { describe, it, expect } from "vitest";
import type { Article } from "@/lib/feed";
import { articleMatchesQuery, filterArticles } from "@/lib/search";

const article: Article = {
  title: "Spring Boot with MongoDB",
  url: "https://example.com/1",
  source: "Dev.to",
  author: "Jane Doe",
  publishedAt: Date.now(),
  description: "A guide to building REST APIs with Kafka integration.",
  topics: [],
};

describe("articleMatchesQuery", () => {
  it("matches empty query", () => {
    expect(articleMatchesQuery(article, "")).toBe(true);
    expect(articleMatchesQuery(article, "   ")).toBe(true);
  });

  it("matches title", () => {
    expect(articleMatchesQuery(article, "spring boot")).toBe(true);
  });

  it("matches description", () => {
    expect(articleMatchesQuery(article, "kafka")).toBe(true);
  });

  it("matches source", () => {
    expect(articleMatchesQuery(article, "dev.to")).toBe(true);
  });

  it("matches author", () => {
    expect(articleMatchesQuery(article, "jane")).toBe(true);
  });

  it("is case insensitive", () => {
    expect(articleMatchesQuery(article, "MONGODB")).toBe(true);
  });

  it("requires all terms to match", () => {
    expect(articleMatchesQuery(article, "spring kafka")).toBe(true);
    expect(articleMatchesQuery(article, "spring graphql")).toBe(false);
  });

  it("returns false when nothing matches", () => {
    expect(articleMatchesQuery(article, "elixir")).toBe(false);
  });

  it("handles missing author", () => {
    const noAuthor = { ...article, author: undefined };
    expect(articleMatchesQuery(noAuthor, "jane")).toBe(false);
    expect(articleMatchesQuery(noAuthor, "mongodb")).toBe(true);
  });
});

describe("smarter matching", () => {
  it("matches whole-word prefixes, not the middle of words", () => {
    const said = { ...article, title: "What the maintainers said", description: "" };
    expect(articleMatchesQuery(said, "ai")).toBe(false);
    expect(articleMatchesQuery(article, "mongo")).toBe(true);
  });

  it("understands common short names", () => {
    const k8s = { ...article, title: "Kubernetes Ingress", description: "" };
    expect(articleMatchesQuery(k8s, "k8s")).toBe(true);
  });

  it("searches topics too", () => {
    const tagged = { ...article, title: "New release", description: "", topics: ["smartphones"] };
    expect(articleMatchesQuery(tagged, "smartphones")).toBe(true);
  });
});

describe("filterArticles", () => {
  const list = [
    article,
    {
      ...article,
      title: "Java Streams Tutorial",
      url: "https://example.com/2",
      description: "Learn functional programming in Java.",
    },
  ];

  it("returns all articles for empty query", () => {
    expect(filterArticles(list, "")).toHaveLength(2);
  });

  it("filters by query", () => {
    expect(filterArticles(list, "kafka")).toHaveLength(1);
    expect(filterArticles(list, "java")).toHaveLength(1);
  });

  it("returns empty array when no matches", () => {
    expect(filterArticles(list, "rust")).toEqual([]);
  });
});
