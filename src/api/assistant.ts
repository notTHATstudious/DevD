import { apiClient } from "./client";
import { Article } from "@/lib/feed";

export type AssistantSearchRequest = {
  query: string;
};

export type AssistantSearchResponse = {
  summary: string;
  articles: Article[];
};

export async function searchAssistant(
  query: string
): Promise<AssistantSearchResponse> {
  const data = await apiClient<AssistantSearchResponse>(
    "/api/v1/devd-assistant/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  return data;
}
