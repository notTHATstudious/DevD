import type { Article } from "@/lib/feed";

/** Quick filter chips shown above the feed and the Saved tab. */
export const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "official", label: "Official" },
  { key: "tutorials", label: "Tutorials" },
  { key: "community", label: "Community" },
  { key: "news", label: "News" },
  { key: "ai", label: "AI" },
  { key: "backend", label: "Backend" },
  { key: "cloud", label: "Cloud" },
  { key: "devops", label: "DevOps" },
  { key: "gadgets", label: "Phones & Laptops" },
  { key: "big_tech", label: "Big Tech" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

const TOPIC_CATEGORIES: Partial<Record<CategoryKey, string[]>> = {
  ai: ["ai_engineering", "llms", "openai", "anthropic"],
  cloud: ["aws", "azure", "gcp", "cloud_native"],
  devops: ["devops", "ci_cd", "docker", "kubernetes"],
  backend: [
    "java", "spring_boot", "spring_cloud", "kafka", "microservices",
    "databases", "postgresql", "mongodb", "redis", "system_design",
    "backend_engineering", "software_architecture", "performance", "testing",
  ],
  gadgets: ["apple", "android", "smartphones", "laptops"],
  big_tech: ["big_tech"],
};

export function matchesCategory(article: Article, category: CategoryKey): boolean {
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
      const wanted = TOPIC_CATEGORIES[category] ?? [];
      return (article.topics || []).some((t) => wanted.includes(t));
    }
  }
}

export function filterByCategory<T extends Article>(articles: T[], category: CategoryKey): T[] {
  if (category === "all") return articles;
  return articles.filter((a) => matchesCategory(a, category));
}
