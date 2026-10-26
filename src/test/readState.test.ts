import { beforeEach, describe, expect, it } from "vitest";
import type { Article } from "@/lib/feed";
import {
  LEGACY_READ_STATE_KEY,
  MAX_READ_ENTRIES,
  READ_HISTORY_MAX_AGE_MS,
  READ_STATE_KEY,
  clearReadHistory,
  filterArticlesByReadState,
  getReadEntries,
  isArticleRead,
  markArticleRead,
  normalizeArticleUrl,
  readStateStore,
  removeReadState,
} from "@/lib/readState";
import { normalizeArticleUrl as bookmarkNormalize } from "@/lib/bookmarks";

const URL = "https://example.com/post?utm_source=rss";
const URL_CANONICAL = "https://example.com/post/";

const article: Article = {
  title: "Test",
  url: URL,
  source: "Dev.to",
  publishedAt: Date.now(),
  description: "Summary",
  topics: [],
};

beforeEach(() => {
  localStorage.clear();
  readStateStore.reset();
});

describe("normalizeArticleUrl", () => {
  it("re-exports bookmark normalization", () => {
    expect(normalizeArticleUrl(URL)).toBe(bookmarkNormalize(URL));
  });
});

describe("read state", () => {
  it("marks a valid https URL as read", () => {
    markArticleRead(URL);
    expect(isArticleRead(URL)).toBe(true);
    expect(getReadEntries()).toHaveLength(1);
  });

  it("prevents duplicate read entries", () => {
    markArticleRead(URL);
    markArticleRead(URL_CANONICAL);
    expect(getReadEntries()).toHaveLength(1);
  });

  it("rejects invalid URLs", () => {
    markArticleRead("javascript:alert(1)");
    expect(getReadEntries()).toHaveLength(0);
  });

  it("stores readAt timestamp", () => {
    const before = Date.now();
    markArticleRead(URL);
    expect(getReadEntries()[0].readAt).toBeGreaterThanOrEqual(before);
  });

  it("returns false for unread articles", () => {
    expect(isArticleRead(URL)).toBe(false);
  });

  it("removes a read entry", () => {
    markArticleRead(URL);
    removeReadState(URL_CANONICAL);
    expect(isArticleRead(URL)).toBe(false);
  });

  it("clears the whole history", () => {
    markArticleRead(URL);
    clearReadHistory();
    expect(getReadEntries()).toHaveLength(0);
  });

  it("returns empty list for invalid JSON", () => {
    localStorage.setItem(READ_STATE_KEY, "{bad");
    expect(getReadEntries()).toEqual([]);
  });

  it("drops corrupt and duplicate entries when loading", () => {
    localStorage.setItem(
      READ_STATE_KEY,
      JSON.stringify([["example.com/a", Date.now()], ["example.com/a", Date.now()], [42, 1], "junk"]),
    );
    expect(getReadEntries()).toHaveLength(1);
  });

  it("caps history size", () => {
    const now = Date.now();
    const many = Array.from({ length: MAX_READ_ENTRIES + 50 }, (_, i) => [`example.com/${i}`, now - i]);
    localStorage.setItem(READ_STATE_KEY, JSON.stringify(many));
    expect(getReadEntries()).toHaveLength(MAX_READ_ENTRIES);
  });

  it("forgets entries older than the history window", () => {
    localStorage.setItem(
      READ_STATE_KEY,
      JSON.stringify([
        ["example.com/new", Date.now()],
        ["example.com/old", Date.now() - READ_HISTORY_MAX_AGE_MS - 1000],
      ]),
    );
    expect(getReadEntries().map((e) => e.key)).toEqual(["example.com/new"]);
  });

  it("returns a stable snapshot until something changes", () => {
    markArticleRead(URL);
    expect(getReadEntries()).toBe(getReadEntries());
  });

  it("survives reload via localStorage", () => {
    markArticleRead(URL);
    readStateStore.reset();
    expect(isArticleRead(URL)).toBe(true);
  });

  it("migrates the per-user (login) format", () => {
    localStorage.setItem(
      LEGACY_READ_STATE_KEY,
      JSON.stringify({
        alice: [{ url: URL, readAt: Date.now() }],
        bob: [{ url: "https://example.com/other", readAt: Date.now() - 1000 }],
      }),
    );
    expect(isArticleRead(URL)).toBe(true);
    expect(isArticleRead("https://example.com/other")).toBe(true);
    expect(localStorage.getItem(LEGACY_READ_STATE_KEY)).toBeNull();
  });
});

describe("filterArticlesByReadState", () => {
  const other: Article = { ...article, url: "https://example.com/other", title: "Other" };
  const isRead = (url: string) => url === URL;

  it("returns all articles for all filter", () => {
    expect(filterArticlesByReadState([article, other], "all", isRead)).toHaveLength(2);
  });

  it("returns only read articles", () => {
    expect(filterArticlesByReadState([article, other], "read", isRead)).toEqual([article]);
  });

  it("returns only unread articles", () => {
    expect(filterArticlesByReadState([article, other], "unread", isRead)).toEqual([other]);
  });
});
