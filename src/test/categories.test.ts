import { describe, it, expect } from "vitest";
import type { Article } from "@/lib/feed";
import { filterByCategory, matchesCategory } from "@/lib/categories";

const base: Article = {
  title: "t",
  url: "https://example.com/a",
  source: "s",
  publishedAt: 0,
  description: "",
  topics: [],
};

describe("categories", () => {
  it("matches source flags", () => {
    expect(matchesCategory({ ...base, isOfficial: true }, "official")).toBe(true);
    expect(matchesCategory(base, "official")).toBe(false);
    expect(matchesCategory({ ...base, isNews: true }, "news")).toBe(true);
  });

  it("groups phone, laptop and chip topics under gadgets", () => {
    expect(matchesCategory({ ...base, topics: ["smartphones"] }, "gadgets")).toBe(true);
    expect(matchesCategory({ ...base, topics: ["laptops"] }, "gadgets")).toBe(true);
    expect(matchesCategory({ ...base, topics: ["java"] }, "gadgets")).toBe(false);
    expect(matchesCategory({ ...base, topics: ["chips_hardware"] }, "gadgets")).toBe(false);
  });

  it("returns everything for all", () => {
    const list = [base, { ...base, url: "https://example.com/b" }];
    expect(filterByCategory(list, "all")).toBe(list);
  });
});
