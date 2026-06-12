import { describe, it, expect } from "vitest";
import { isValidArticleUrl } from "@/lib/articleUrl";

describe("isValidArticleUrl", () => {
  it("accepts https URLs", () => {
    expect(isValidArticleUrl("https://example.com/post")).toBe(true);
    expect(isValidArticleUrl("https://dev.to/user/article-slug")).toBe(true);
    expect(isValidArticleUrl("  https://example.com/path?q=1  ")).toBe(true);
  });

  it("rejects http URLs", () => {
    expect(isValidArticleUrl("http://example.com/post")).toBe(false);
  });

  it("rejects dangerous schemes", () => {
    expect(isValidArticleUrl("javascript:alert(1)")).toBe(false);
    expect(isValidArticleUrl("JavaScript:alert(1)")).toBe(false);
    expect(isValidArticleUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isValidArticleUrl("file:///etc/passwd")).toBe(false);
    expect(isValidArticleUrl("blob:https://example.com/uuid")).toBe(false);
    expect(isValidArticleUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isValidArticleUrl("about:blank")).toBe(false);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isValidArticleUrl("//evil.com/phish")).toBe(false);
  });

  it("rejects empty and malformed URLs", () => {
    expect(isValidArticleUrl("")).toBe(false);
    expect(isValidArticleUrl("   ")).toBe(false);
    expect(isValidArticleUrl("not-a-url")).toBe(false);
    expect(isValidArticleUrl("/relative/path")).toBe(false);
  });

  it("rejects https URLs without a host", () => {
    expect(isValidArticleUrl("https://")).toBe(false);
  });
});
