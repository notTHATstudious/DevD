export const TOPICS = {
  java: "Java",
  spring_boot: "Spring Boot",
  spring_cloud: "Spring Cloud",
  kafka: "Kafka",
  microservices: "Microservices",
  docker: "Docker",
  kubernetes: "Kubernetes",
  aws: "AWS",
  azure: "Azure",
  gcp: "GCP",
  devops: "DevOps",
  ci_cd: "CI/CD",
  databases: "Databases",
  postgresql: "PostgreSQL",
  mongodb: "MongoDB",
  redis: "Redis",
  ai_engineering: "AI Engineering",
  llms: "LLMs",
  openai: "OpenAI",
  anthropic: "Anthropic",
  system_design: "System Design",
  backend_engineering: "Backend Engineering",
  software_architecture: "Software Architecture",
  security: "Security",
  performance: "Performance",
  testing: "Testing",
  cloud_native: "Cloud Native",
  apple: "Apple",
  android: "Android",
  smartphones: "Smartphones",
  laptops: "Laptops",
  chips_hardware: "Chips & Hardware",
  big_tech: "Big Tech",
} as const;

export type TopicKey = keyof typeof TOPICS;

export type TopicPreferences = Record<TopicKey, boolean>;

export const TOPIC_KEYS = Object.keys(TOPICS) as TopicKey[];

/** Sections for the Topics screen. */
export const TOPIC_GROUPS: { label: string; keys: TopicKey[] }[] = [
  {
    label: "Backend & Java",
    keys: ["java", "spring_boot", "spring_cloud", "kafka", "microservices", "backend_engineering"],
  },
  { label: "Data", keys: ["databases", "postgresql", "mongodb", "redis"] },
  {
    label: "Cloud & DevOps",
    keys: ["docker", "kubernetes", "aws", "azure", "gcp", "devops", "ci_cd", "cloud_native"],
  },
  { label: "AI", keys: ["ai_engineering", "llms", "openai", "anthropic"] },
  {
    label: "Engineering practice",
    keys: ["system_design", "software_architecture", "security", "performance", "testing"],
  },
  {
    label: "Big Tech & Gadgets",
    keys: ["big_tech", "apple", "android", "smartphones", "laptops", "chips_hardware"],
  },
];

const STORAGE_KEY = "dailyd_topic_preferences";

/** Retrieve topic preferences from localStorage. Defaults to all true if empty. */
export function getSavedPreferences(): TopicPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultPreferences();
    }
    const parsed = JSON.parse(raw) as Partial<TopicPreferences>;
    const prefs = getDefaultPreferences();
    for (const key of TOPIC_KEYS) {
      if (typeof parsed[key] === "boolean") {
        prefs[key] = parsed[key] as boolean;
      }
    }
    return prefs;
  } catch {
    return getDefaultPreferences();
  }
}

/** Set/save topic preferences to localStorage. */
export function savePreferences(prefs: TopicPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage write issues
  }
}

export function getDefaultPreferences(): TopicPreferences {
  const prefs = {} as TopicPreferences;
  for (const key of TOPIC_KEYS) {
    prefs[key] = true;
  }
  return prefs;
}

/** Regex maps for topic identification */
export const TOPIC_REGEX_MAP: Record<TopicKey, RegExp> = {
  java: /\b(java|jvm|jdk|jre|openjdk)\b(?!script)/i,
  spring_boot: /\b(spring[- ]?boot|springboot)\b/i,
  spring_cloud: /\b(spring[- ]?cloud)\b/i,
  kafka: /\b(kafka|apache[- ]kafka|confluent|event[- ]streaming)\b/i,
  microservices: /\b(micro[- ]?services?|distributed[- ]?tracing)\b/i,
  docker: /\b(docker|container\s+image|dockerfile)\b/i,
  kubernetes: /\b(kubernetes|k8s|kubelet|kubectl|helm)\b/i,
  aws: /\b(aws|amazon\s+web\s+services|dynamodb|s3|iam|lambda)\b/i,
  azure: /\b(azure|cosmosdb)\b/i,
  gcp: /\b(gcp|google\s+cloud|bigquery|spanner)\b/i,
  devops: /\b(devops|sre|ansible|puppet|chef|terraform|opentofu)\b/i,
  ci_cd: /\b(ci\/cd|continuous[- ]?integration|continuous[- ]?deployment|github[- ]?actions|jenkins)\b/i,
  databases: /\b(databases?|rdbms|nosql|sql|indexing|query[- ]?optimization)\b/i,
  postgresql: /\b(postgresql|postgres)\b/i,
  mongodb: /\b(mongodb|mongo)\b/i,
  redis: /\b(redis)\b/i,
  ai_engineering: /\b(ai[- ]?engineering|generative[- ]?ai|genai|prompt[- ]?engineering|vector[- ]?database)\b/i,
  llms: /\b(llms?|large[- ]?language[- ]?models?|rag|fine[- ]?tuning|llama|ollama)\b/i,
  openai: /\b(openai|chatgpt|gpt[- ]?[45])\b/i,
  anthropic: /\b(anthropic|claude)\b/i,
  system_design: /\b(system[- ]?design|scalability|load[- ]?balancing|rate[- ]?limiting|caching|high[- ]?availability)\b/i,
  backend_engineering: /\b(backend|rest[- ]?apis?|graphql|grpc|routing|middleware)\b/i,
  software_architecture: /\b(software[- ]?architecture|design[- ]?patterns|domain[- ]?driven[- ]?design|ddd|event[- ]?sourcing)\b/i,
  security: /\b(security|cybersecurity|owasp|cryptography|encryption|vulnerability|exploit|oauth|jwt)\b/i,
  performance: /\b(performance|latency|concurrency|async|threads?|throughput|profiling|optimization)\b/i,
  testing: /\b(testing|unit[- ]?tests?|integration[- ]?tests?|tdd|mocking|vitest|junit)\b/i,
  cloud_native: /\b(cloud[- ]?native|cncf|serverless|envoy|istio)\b/i,
  apple: /\b(apple|iphones?|ipad|ipados|macbook|imac|mac\s?os|macos|ios\s?\d*|watchos|visionos|vision\s+pro|airpods|wwdc|swiftui|xcode)\b/i,
  android: /\b(android|pixel\s?\d*|one\s?ui|wear\s?os|jetpack\s+compose|kotlin)\b/i,
  smartphones: /\b(smartphones?|phones?|iphones?|galaxy\s+[szaf]\d*|pixel\s?\d+|oneplus|xiaomi|oppo|vivo|foldables?|snapdragon)\b/i,
  laptops: /\b(laptops?|macbook|chromebooks?|thinkpad|surface\s+(pro|laptop)|xps|zenbook|copilot\+\s?pc|ultrabook)\b/i,
  chips_hardware: /\b(cpus?|gpus?|chips?|silicon|semiconductors?|nvidia|amd|intel|qualcomm|arm|tsmc|rtx\s?\d+|ryzen|m[1-9]\s+(pro|max|ultra|chip))\b/i,
  big_tech: /\b(apple|google|alphabet|microsoft|meta|amazon|nvidia|samsung|tesla|netflix)\b/i,
};

/** Identify matching topics for text */
export function getMatchedTopics(title: string, description: string): TopicKey[] {
  const text = `${title} ${description}`.toLowerCase();
  const matched: TopicKey[] = [];
  for (const key of TOPIC_KEYS) {
    const re = TOPIC_REGEX_MAP[key];
    if (re.test(text)) {
      matched.push(key);
    }
  }
  return matched;
}

/**
 * Filter articles by topic preferences. If none or all are enabled, show all.
 * Articles with no detected topic are always kept — previously they were
 * silently hidden, which dropped roughly a third of the feed.
 */
export function filterByTopicPreferences<T extends { topics?: string[] }>(
  articles: T[],
  prefs: TopicPreferences,
): T[] {
  const enabledCount = TOPIC_KEYS.filter((k) => prefs[k]).length;
  if (enabledCount === 0 || enabledCount === TOPIC_KEYS.length) {
    return articles;
  }

  return articles.filter((article) => {
    const articleTopics = article.topics || [];
    if (articleTopics.length === 0) return true;
    return articleTopics.some((topic) => prefs[topic as TopicKey]);
  });
}
