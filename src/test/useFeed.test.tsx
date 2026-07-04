import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  FEED_GC_TIME_MS,
  FEED_QUERY_KEY,
  FEED_STALE_TIME_MS,
} from "@/lib/useFeed";
import { getArticles } from "@/api/articles";
import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/lib/feed";

// Mock the apiClient module
vi.mock("@/api/client", () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from "@/api/client";

const mockArticle: Article = {
  title: "Test Article Title",
  url: "https://example.com/test-article",
  source: "Dev.to",
  author: "Test Author",
  publishedAt: Date.now() - 3600000, // 1h ago
  description: "Test description of the article",
  topics: ["java", "spring_boot"],
};

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

describe("API integration & getArticles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("successfully fetches articles from backend API", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      total: 1,
      articles: [mockArticle],
    });

    const result = await getArticles();
    expect(apiClient).toHaveBeenCalledWith("/api/v1/articles");
    expect(result.articles).toHaveLength(1);
    expect(result.articles[0]).toEqual(mockArticle);
    expect(result.usedFallback).toBe(false);
  });

  it("returns empty articles list when API returns empty payload", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      total: 0,
      articles: [],
    });

    const result = await getArticles();
    expect(result.articles).toHaveLength(0);
    expect(result.usedFallback).toBe(false);
  });

  it("propagates API client errors", async () => {
    const apiError = new Error("API Failure");
    vi.mocked(apiClient).mockRejectedValueOnce(apiError);

    await expect(getArticles()).rejects.toThrow("API Failure");
  });
});

describe("Article rendering", () => {
  it("renders ArticleCard elements correctly", () => {
    const mockOnToggle = vi.fn();
    render(
      <ArticleCard
        article={mockArticle}
        bookmarked={false}
        read={false}
        onToggleBookmark={mockOnToggle}
      />
    );

    // Assertions using React Testing Library
    expect(screen.getByText("Test Article Title")).toBeInTheDocument();
    expect(screen.getByText("Dev.to")).toBeInTheDocument();
    expect(screen.getByText("by Test Author")).toBeInTheDocument();
    expect(screen.getByText("Test description of the article")).toBeInTheDocument();
    expect(screen.getByText("java")).toBeInTheDocument();
    expect(screen.getByText("spring boot")).toBeInTheDocument();
  });
});
