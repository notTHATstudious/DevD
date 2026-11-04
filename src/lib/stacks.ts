import type { TopicKey } from "@/lib/preferences";
import { createLocalStore, readJson } from "@/lib/localStore";

/**
 * Tracks (Backend / Frontend / Full-stack) and the stacks inside them.
 * Full-stack = the backend stacks plus the frontend stacks you pick.
 */
export type Track = "backend" | "frontend" | "fullstack";

export const TRACKS: { key: Track; label: string; hint: string }[] = [
  { key: "backend", label: "Backend", hint: "APIs, services, data" },
  { key: "frontend", label: "Frontend", hint: "UI, web, browsers" },
  { key: "fullstack", label: "Full-stack", hint: "A bit of both" },
];

export const STACKS = {
  java_spring: { side: "backend", label: "Java · Spring Boot", topics: ["java", "spring_boot", "spring_cloud", "kafka", "microservices"] },
  python: { side: "backend", label: "Python · FastAPI", topics: ["python", "fastapi", "django"] },
  node: { side: "backend", label: "Node.js · NestJS", topics: ["nodejs", "nestjs"] },
  go: { side: "backend", label: "Go", topics: ["golang"] },
  dotnet: { side: "backend", label: "C# · .NET", topics: ["dotnet"] },
  react: { side: "frontend", label: "React · Next.js", topics: ["react", "nextjs"] },
  angular: { side: "frontend", label: "Angular", topics: ["angular"] },
  vue: { side: "frontend", label: "Vue · Nuxt", topics: ["vue"] },
  svelte: { side: "frontend", label: "Svelte", topics: ["svelte"] },
  web: { side: "frontend", label: "Web basics", topics: ["typescript", "web_platform"] },
} satisfies Record<string, { side: "backend" | "frontend"; label: string; topics: TopicKey[] }>;

export type StackKey = keyof typeof STACKS;

export const STACK_KEYS = Object.keys(STACKS) as StackKey[];

/** Every topic that belongs to some stack (as opposed to shared topics like Kubernetes). */
const STACK_TOPICS = new Set<string>(STACK_KEYS.flatMap((k) => STACKS[k].topics));

export function stacksForTrack(track: Track): StackKey[] {
  if (track === "fullstack") return STACK_KEYS;
  return STACK_KEYS.filter((k) => STACKS[k].side === track);
}

export type Profile = {
  track: Track;
  /** Chosen stacks; always a non-empty subset of the track's stacks. */
  stacks: StackKey[];
};

export const DEFAULT_PROFILE: Profile = { track: "backend", stacks: stacksForTrack("backend") };

export const PROFILE_KEY = "dailyd_profile";

export function sanitizeProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<Profile>;
  if (p.track !== "backend" && p.track !== "frontend" && p.track !== "fullstack") return null;
  const allowed = stacksForTrack(p.track);
  const stacks = Array.isArray(p.stacks)
    ? allowed.filter((k) => (p.stacks as unknown[]).includes(k))
    : [];
  return { track: p.track, stacks: stacks.length ? stacks : allowed };
}

/** null until the visitor answers (or skips) the first-visit question. */
export const profileStore = createLocalStore<Profile | null>({
  key: PROFILE_KEY,
  parse: sanitizeProfile,
});

export function hasAnsweredProfile(): boolean {
  return sanitizeProfile(readJson(PROFILE_KEY)) !== null;
}

/** Topics of the chosen stacks. */
export function profileTopics(profile: Profile): Set<string> {
  return new Set(profile.stacks.flatMap((k) => STACKS[k].topics as readonly string[]));
}

/**
 * Hide articles that belong only to stacks you didn't pick. Articles about
 * shared topics (cloud, AI, gadgets…) or with no detected topic stay.
 */
export function filterByProfile<T extends { topics?: string[] }>(articles: T[], profile: Profile): T[] {
  const mine = profileTopics(profile);
  return articles.filter((a) => {
    const stackTopics = (a.topics ?? []).filter((t) => STACK_TOPICS.has(t));
    return stackTopics.length === 0 || stackTopics.some((t) => mine.has(t));
  });
}

/**
 * Switch track but keep the stacks you already picked where they still fit.
 * A side (backend/frontend) the new track needs but has nothing chosen gets all its stacks.
 */
export function switchTrack(profile: Profile | null, track: Track): Profile {
  const allowed = stacksForTrack(track);
  let stacks = (profile?.stacks ?? []).filter((k) => allowed.includes(k));
  const sides: ("backend" | "frontend")[] = track === "fullstack" ? ["backend", "frontend"] : [track];
  for (const side of sides) {
    if (!stacks.some((k) => STACKS[k].side === side)) {
      stacks = [...stacks, ...STACK_KEYS.filter((k) => STACKS[k].side === side)];
    }
  }
  return { track, stacks: STACK_KEYS.filter((k) => stacks.includes(k)) };
}

/** Toggle one stack, never leaving a needed side empty. */
export function toggleStack(profile: Profile, key: StackKey): Profile {
  const on = profile.stacks.includes(key);
  const stacks = on ? profile.stacks.filter((k) => k !== key) : [...profile.stacks, key];
  const side = STACKS[key].side;
  if (on && !stacks.some((k) => STACKS[k].side === side)) return profile;
  return { ...profile, stacks: STACK_KEYS.filter((k) => stacks.includes(k)) };
}
