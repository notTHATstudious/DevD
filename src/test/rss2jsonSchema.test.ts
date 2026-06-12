import { describe, it, expect } from "vitest";
import { parseRss2JsonResponse } from "@/lib/rss2jsonSchema";

const validItem = {
  title: "Hello",
  link: "https://example.com/post",
  pubDate: "Mon, 01 Jan 2026 12:00:00 GMT",
  author: "Jane",
  description: "<p>Summary</p>",
};

describe("parseRss2JsonResponse", () => {
  it("accepts a valid rss2json response", () => {
    const data = { status: "ok", items: [validItem] };
    const parsed = parseRss2JsonResponse(data);
    expect(parsed).not.toBeNull();
    expect(parsed?.items).toHaveLength(1);
    expect(parsed?.items[0].title).toBe("Hello");
  });

  it("accepts an empty items array", () => {
    const parsed = parseRss2JsonResponse({ status: "ok", items: [] });
    expect(parsed).toEqual({ status: "ok", items: [] });
  });

  it("accepts items with only optional fields omitted", () => {
    const parsed = parseRss2JsonResponse({ status: "ok", items: [{}] });
    expect(parsed?.items).toHaveLength(1);
  });

  it("rejects non-ok status", () => {
    expect(parseRss2JsonResponse({ status: "error", items: [] })).toBeNull();
  });

  it("rejects missing items", () => {
    expect(parseRss2JsonResponse({ status: "ok" })).toBeNull();
  });

  it("rejects items that are not an array", () => {
    expect(parseRss2JsonResponse({ status: "ok", items: "nope" })).toBeNull();
  });

  it("rejects null and non-object payloads", () => {
    expect(parseRss2JsonResponse(null)).toBeNull();
    expect(parseRss2JsonResponse("feed")).toBeNull();
    expect(parseRss2JsonResponse([])).toBeNull();
  });

  it("rejects items with invalid field types", () => {
    expect(
      parseRss2JsonResponse({
        status: "ok",
        items: [{ title: 123 }],
      }),
    ).toBeNull();
  });

  it("strips unknown top-level fields from the parsed result", () => {
    const parsed = parseRss2JsonResponse({
      status: "ok",
      items: [],
      feed: { title: "Extra" },
    });
    expect(parsed).toEqual({ status: "ok", items: [] });
    expect(parsed).not.toHaveProperty("feed");
  });
});
