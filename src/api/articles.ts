import { apiClient } from "./client";
import { Article, FeedResult } from "@/lib/feed";

type BackendArticlesResponse = {
  total: number;
  articles: Article[];
  lastUpdated?: number;
};

export async function getArticles(): Promise<FeedResult> {
  const data = await apiClient<BackendArticlesResponse>("/api/v1/articles");
  return {
    articles: data.articles || [],
    usedFallback: false,
    lastUpdated: data.lastUpdated,
  };
}
