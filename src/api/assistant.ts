import { apiClient } from "./client";
import { Article } from "@/lib/feed";

export type AssistantSearchRequest = {
  query: string;
  limit?: number;
  offset?: number;
};

export type AssistantSearchResponse = {
  summary: string;
  articles: Article[];
  total: number;
  /** Corrected query when typos were fixed, e.g. "kubernetes". */
  didYouMean?: string | null;
  /** Follow-up searches built from the topics in the results. */
  suggestions: string[];
  /** True when nothing matched every word and these are the closest matches. */
  partial: boolean;
};

export const ASSISTANT_PAGE_SIZE = 10;

export async function searchAssistant({
  query,
  limit = ASSISTANT_PAGE_SIZE,
  offset = 0,
}: AssistantSearchRequest): Promise<AssistantSearchResponse> {
  const data = await apiClient<Partial<AssistantSearchResponse>>("/api/v1/devd-assistant/search", {
    method: "POST",
    body: JSON.stringify({ query, limit, offset }),
  });
  return {
    summary: data.summary ?? "",
    articles: data.articles ?? [],
    total: data.total ?? data.articles?.length ?? 0,
    didYouMean: data.didYouMean ?? null,
    suggestions: data.suggestions ?? [],
    partial: data.partial ?? false,
  };
}
