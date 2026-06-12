import { describe, it, expect } from "vitest";
import {
  FEED_GC_TIME_MS,
  FEED_QUERY_KEY,
  FEED_STALE_TIME_MS,
} from "@/lib/useFeed";

describe("useFeed config", () => {
  it("uses a stable feed query key", () => {
    expect(FEED_QUERY_KEY).toEqual(["feed"]);
  });

  it("sets staleTime to 15 minutes", () => {
    expect(FEED_STALE_TIME_MS).toBe(15 * 60 * 1000);
  });

  it("sets gcTime to 30 minutes", () => {
    expect(FEED_GC_TIME_MS).toBe(30 * 60 * 1000);
  });
});
