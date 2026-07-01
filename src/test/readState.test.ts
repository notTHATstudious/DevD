import { beforeEach, describe, expect, it } from "vitest";
import type { Article } from "@/lib/feed";
import {
  filterArticlesByReadState,
  getReadEntries,
  isArticleRead,
  markArticleRead,
  normalizeArticleUrl,
  removeReadState,
} from "@/lib/readState";

const USER = "alice";
const OTHER = "bob";
const URL = "https://example.com/post?utm=1";
const URL_CANONICAL = "https://example.com/post/";

const article: Article = {
  title: "Test",
  url: URL,
  source: "Dev.to",
  publishedAt: Date.now(),
  description: "Summary",
};

beforeEach(() => {
  localStorage.clear();
});

describe("normalizeArticleUrl", () => {
  it("re-exports bookmark normalization", () => {
    expect(normalizeArticleUrl("https://Example.com/post/?")).toBe(
      "https://example.com/post",
    );
  });
});

describe("markArticleRead", () => {
  it("marks a valid https URL as read", () => {
    markArticleRead(USER, URL);
    expect(isArticleRead(USER, URL)).toBe(true);
    expect(getReadEntries(USER)).toHaveLength(1);
  });

  it("prevents duplicate read entries", () => {
    markArticleRead(USER, URL);
    markArticleRead(USER, URL_CANONICAL);
    expect(getReadEntries(USER)).toHaveLength(1);
  });

  it("rejects invalid URLs", () => {
    markArticleRead(USER, "javascript:alert(1)");
    expect(getReadEntries(USER)).toHaveLength(0);
  });

  it("stores readAt timestamp", () => {
    markArticleRead(USER, URL);
    expect(getReadEntries(USER)[0].readAt).toBeTypeOf("number");
  });
});

describe("isArticleRead", () => {
  it("returns false for unread articles", () => {
    expect(isArticleRead(USER, URL)).toBe(false);
  });

  it("matches normalized URLs", () => {
    markArticleRead(USER, URL);
    expect(isArticleRead(USER, URL_CANONICAL)).toBe(true);
  });
});

describe("removeReadState", () => {
  it("removes a read entry", () => {
    markArticleRead(USER, URL);
    removeReadState(USER, URL);
    expect(isArticleRead(USER, URL)).toBe(false);
  });
});

describe("per-user isolation", () => {
  it("scopes read state per user", () => {
    markArticleRead(USER, URL);
    expect(isArticleRead(OTHER, URL)).toBe(false);
  });
});

describe("corrupted storage recovery", () => {
  it("returns empty list for invalid JSON", () => {
    localStorage.setItem("dailyd_read_state", "not-json");
    expect(getReadEntries(USER)).toEqual([]);
  });

  it("filters invalid entries when loading", () => {
    localStorage.setItem(
      "dailyd_read_state",
      JSON.stringify({
        [USER]: [
          { url: URL, readAt: Date.now() },
          { url: "javascript:evil", readAt: Date.now() },
          { url: 123, readAt: Date.now() },
        ],
      }),
    );
    expect(getReadEntries(USER)).toHaveLength(1);
    expect(getReadEntries(USER)[0].url).toBe(URL);
  });

  it("dedupes corrupted duplicate entries on load", () => {
    localStorage.setItem(
      "dailyd_read_state",
      JSON.stringify({
        [USER]: [
          { url: URL, readAt: 100 },
          { url: URL_CANONICAL, readAt: 200 },
        ],
      }),
    );
    expect(getReadEntries(USER)).toHaveLength(1);
  });
});

describe("filterArticlesByReadState", () => {
  const articles = [
    article,
    { ...article, title: "Two", url: "https://example.com/two" },
    { ...article, title: "Three", url: "https://example.com/three" },
  ];

  const isRead = (url: string) =>
    normalizeArticleUrl(url) === normalizeArticleUrl(URL);

  it("returns all articles for all filter", () => {
    expect(filterArticlesByReadState(articles, "all", isRead)).toHaveLength(3);
  });

  it("returns only read articles", () => {
    expect(filterArticlesByReadState(articles, "read", isRead)).toHaveLength(1);
    expect(filterArticlesByReadState(articles, "read", isRead)[0].url).toBe(URL);
  });

  it("returns only unread articles", () => {
    expect(filterArticlesByReadState(articles, "unread", isRead)).toHaveLength(2);
  });

  it("composes with search-style narrowing", () => {
    const searched = articles.filter((a) => a.title.includes("Two") || a.title === "Test");
    const filtered = filterArticlesByReadState(searched, "unread", isRead);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Two");
  });
});

describe("persistence", () => {
  it("survives reload via localStorage", () => {
    markArticleRead(USER, URL);
    expect(getReadEntries(USER)).toHaveLength(1);
    expect(localStorage.getItem("dailyd_read_state")).toContain(URL);
    expect(isArticleRead(USER, URL)).toBe(true);
  });
});
