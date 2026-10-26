import { describe, it, expect, beforeEach } from "vitest";
import type { Article } from "@/lib/feed";
import {
  BOOKMARKS_KEY,
  LEGACY_BOOKMARKS_KEY,
  MAX_BOOKMARKS,
  addBookmark,
  bookmarkStore,
  getBookmarkCount,
  getBookmarks,
  isBookmarked,
  normalizeArticleUrl,
  removeBookmark,
  toggleBookmark,
} from "@/lib/bookmarks";

const sample: Article = {
  title: "Spring Boot Tips",
  url: "https://example.com/post?utm_source=rss",
  source: "Dev.to",
  author: "Jane",
  publishedAt: Date.now(),
  description: "A short summary.",
  topics: ["spring_boot"],
  isCommunity: true,
};

beforeEach(() => {
  localStorage.clear();
  bookmarkStore.reset();
});

describe("normalizeArticleUrl", () => {
  it("drops tracking params, www and trailing slash", () => {
    expect(normalizeArticleUrl("https://www.Example.com/post/?utm_source=x")).toBe("example.com/post");
  });

  it("keeps meaningful query params so different posts stay distinct", () => {
    expect(normalizeArticleUrl("https://blog.dev/?p=1")).not.toBe(normalizeArticleUrl("https://blog.dev/?p=2"));
  });
});

describe("bookmarks", () => {
  it("returns empty list when storage is missing", () => {
    expect(getBookmarks()).toEqual([]);
    expect(getBookmarkCount()).toBe(0);
  });

  it("adds and detects bookmarks", () => {
    addBookmark(sample);
    expect(getBookmarkCount()).toBe(1);
    expect(isBookmarked(sample.url)).toBe(true);
  });

  it("keeps topics and source flags so topic filters still match", () => {
    addBookmark(sample);
    expect(getBookmarks()[0].topics).toEqual(["spring_boot"]);
    expect(getBookmarks()[0].isCommunity).toBe(true);
  });

  it("prevents duplicate bookmarks by normalized url", () => {
    addBookmark(sample);
    addBookmark({ ...sample, url: "https://example.com/post/" });
    expect(getBookmarkCount()).toBe(1);
  });

  it("removes bookmarks", () => {
    addBookmark(sample);
    removeBookmark(sample.url);
    expect(getBookmarkCount()).toBe(0);
  });

  it("toggles bookmarks", () => {
    toggleBookmark(sample);
    expect(isBookmarked(sample.url)).toBe(true);
    toggleBookmark(sample);
    expect(isBookmarked(sample.url)).toBe(false);
  });

  it("handles corrupt storage gracefully", () => {
    localStorage.setItem(BOOKMARKS_KEY, "not-json");
    expect(getBookmarks()).toEqual([]);
  });

  it("rejects bookmarks with non-https URLs", () => {
    addBookmark({ ...sample, url: "javascript:alert(1)" });
    expect(getBookmarkCount()).toBe(0);
  });

  it("filters invalid URLs when loading from storage", () => {
    localStorage.setItem(
      BOOKMARKS_KEY,
      JSON.stringify([sample, { ...sample, url: "data:text/html,evil", title: "Bad" }]),
    );
    expect(getBookmarks()).toHaveLength(1);
    expect(getBookmarks()[0].url).toBe(sample.url);
  });

  it("caps the number of stored bookmarks", () => {
    for (let i = 0; i < MAX_BOOKMARKS + 5; i++) {
      addBookmark({ ...sample, url: `https://example.com/p/${i}` });
    }
    expect(getBookmarkCount()).toBe(MAX_BOOKMARKS);
  });

  it("persists across reloads", () => {
    addBookmark(sample);
    bookmarkStore.reset();
    expect(isBookmarked(sample.url)).toBe(true);
  });

  it("notifies subscribers on change", () => {
    let calls = 0;
    const unsubscribe = bookmarkStore.subscribe(() => calls++);
    addBookmark(sample);
    removeBookmark(sample.url);
    unsubscribe();
    expect(calls).toBe(2);
  });
});

describe("migration from the per-user (login) format", () => {
  it("merges every old user's bookmarks into one list and removes the old key", () => {
    localStorage.setItem(
      LEGACY_BOOKMARKS_KEY,
      JSON.stringify({
        alice: [{ ...sample, savedAt: 1 }],
        bob: [
          { ...sample, savedAt: 2 }, // same article as alice's → deduped
          { ...sample, url: "https://example.com/other", savedAt: 3 },
        ],
      }),
    );
    const list = getBookmarks();
    expect(list.map((b) => b.url)).toEqual(["https://example.com/other", sample.url]);
    expect(localStorage.getItem(LEGACY_BOOKMARKS_KEY)).toBeNull();
    expect(localStorage.getItem(BOOKMARKS_KEY)).not.toBeNull();
  });
});
