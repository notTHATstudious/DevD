import type { Article } from "@/lib/feed";
import { STACKS, type StackKey } from "@/lib/stacks";

/** Quick filter chips shown above the feed and the Saved tab. */
export const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "official", label: "Official" },
  { key: "tutorials", label: "Tutorials" },
  { key: "community", label: "Community" },
  { key: "news", label: "News" },
  { key: "ai", label: "AI" },
  { key: "cloud", label: "Cloud" },
  { key: "devops", label: "DevOps" },
  { key: "gadgets", label: "Phones & Laptops" },
  { key: "big_tech", label: "Big Tech" },
] as const;

/** A fixed category, or one of your stacks ("stack:python"). */
export type CategoryKey = (typeof CATEGORIES)[number]["key"] | `stack:${StackKey}`;

const TOPIC_CATEGORIES: Partial<Record<CategoryKey, string[]>> = {
  ai: ["ai_engineering", "llms", "openai", "anthropic"],
  cloud: ["aws", "azure", "gcp", "cloud_native"],
  devops: ["devops", "ci_cd", "docker", "kubernetes"],
  gadgets: ["apple", "android", "smartphones", "laptops"],
  big_tech: ["big_tech"],
};

export function matchesCategory(article: Article, category: CategoryKey): boolean {
  if (category.startsWith("stack:")) {
    const stack = STACKS[category.slice(6) as StackKey];
    const wanted: readonly string[] = stack?.topics ?? [];
    return (article.topics || []).some((t) => wanted.includes(t));
  }
  switch (category) {
    case "all":
      return true;
    case "official":
      return !!article.isOfficial;
    case "tutorials":
      return !!article.isTutorial;
    case "community":
      return !!article.isCommunity;
    case "news":
      return !!article.isNews;
    default: {
      const wanted = TOPIC_CATEGORIES[category as keyof typeof TOPIC_CATEGORIES] ?? [];
      return (article.topics || []).some((t) => wanted.includes(t));
    }
  }
}

export function filterByCategory<T extends Article>(articles: T[], category: CategoryKey): T[] {
  if (category === "all") return articles;
  return articles.filter((a) => matchesCategory(a, category));
}
