import { apiClient } from "./client";
import { Article, FeedResult } from "@/lib/feed";

type BackendArticlesResponse = {
  total: number;
  articles: Article[];
};

export async function getArticles(): Promise<FeedResult> {
  try {
    const data = await apiClient<BackendArticlesResponse>("/api/v1/articles");
    return {
      articles: data.articles || [],
      usedFallback: false,
    };
  } catch (error) {
    console.error("Failed to fetch articles from backend:", error);
    throw error;
  }
}
