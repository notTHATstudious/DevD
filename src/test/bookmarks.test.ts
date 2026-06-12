import { describe, it, expect, beforeEach } from "vitest";
import type { Article } from "@/lib/feed";
import {
  addBookmark,
  getBookmarkCount,
  getBookmarks,
  isBookmarked,
  normalizeArticleUrl,
  removeBookmark,
  toggleBookmark,
} from "@/lib/bookmarks";

const USER = "testuser";

const sample: Article = {
  title: "Spring Boot Tips",
  url: "https://example.com/post?utm=1",
  source: "Dev.to",
  author: "Jane",
  publishedAt: Date.now(),
  description: "A short summary.",
};

beforeEach(() => {
  localStorage.clear();
});

describe("normalizeArticleUrl", () => {
  it("strips query params and trailing slash", () => {
    expect(normalizeArticleUrl("https://Example.com/post/?")).toBe(
      "https://example.com/post",
    );
  });
});

describe("bookmarks", () => {
  it("returns empty list when storage is missing", () => {
    expect(getBookmarks(USER)).toEqual([]);
    expect(getBookmarkCount(USER)).toBe(0);
  });

  it("adds and detects bookmarks", () => {
    addBookmark(USER, sample);
    expect(getBookmarkCount(USER)).toBe(1);
    expect(isBookmarked(USER, sample.url)).toBe(true);
  });

  it("prevents duplicate bookmarks by normalized url", () => {
    addBookmark(USER, sample);
    addBookmark(USER, { ...sample, url: "https://example.com/post/" });
    expect(getBookmarkCount(USER)).toBe(1);
  });

  it("removes bookmarks", () => {
    addBookmark(USER, sample);
    removeBookmark(USER, sample.url);
    expect(getBookmarkCount(USER)).toBe(0);
  });

  it("toggles bookmarks", () => {
    toggleBookmark(USER, sample);
    expect(isBookmarked(USER, sample.url)).toBe(true);
    toggleBookmark(USER, sample);
    expect(isBookmarked(USER, sample.url)).toBe(false);
  });

  it("scopes bookmarks per user", () => {
    addBookmark(USER, sample);
    expect(getBookmarkCount("other")).toBe(0);
  });

  it("handles corrupt storage gracefully", () => {
    localStorage.setItem("dailyd_bookmarks", "not-json");
    expect(getBookmarks(USER)).toEqual([]);
  });

  it("rejects bookmarks with non-https URLs", () => {
    addBookmark(USER, {
      ...sample,
      url: "javascript:alert(1)",
    });
    expect(getBookmarkCount(USER)).toBe(0);
  });

  it("filters invalid URLs when loading from storage", () => {
    localStorage.setItem(
      "dailyd_bookmarks",
      JSON.stringify({
        [USER]: [
          sample,
          {
            ...sample,
            url: "data:text/html,evil",
            title: "Bad",
          },
        ],
      }),
    );
    expect(getBookmarks(USER)).toHaveLength(1);
    expect(getBookmarks(USER)[0].url).toBe(sample.url);
  });
});
