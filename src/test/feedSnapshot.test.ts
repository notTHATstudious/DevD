import { beforeEach, describe, expect, it } from "vitest";
import type { Article } from "@/lib/feed";
import { SNAPSHOT_KEY, SNAPSHOT_SIZE, loadFeedSnapshot, saveFeedSnapshot } from "@/lib/feedSnapshot";

const make = (i: number): Article => ({
  title: `Article ${i}`,
  url: `https://example.com/${i}`,
  source: "s",
  publishedAt: Date.now() - i,
  description: "d",
  topics: [],
});

beforeEach(() => localStorage.clear());

describe("feed snapshot", () => {
  it("stores only the newest articles", () => {
    saveFeedSnapshot(Array.from({ length: 500 }, (_, i) => make(i)));
    const snap = loadFeedSnapshot();
    expect(snap?.articles).toHaveLength(SNAPSHOT_SIZE);
    expect(snap?.usedFallback).toBe(true);
  });

  it("ignores stale or corrupt snapshots", () => {
    saveFeedSnapshot([make(1)]);
    expect(loadFeedSnapshot(Date.now() + 10 * 24 * 60 * 60 * 1000)).toBeUndefined();
    localStorage.setItem(SNAPSHOT_KEY, "nope");
    expect(loadFeedSnapshot()).toBeUndefined();
  });
});
