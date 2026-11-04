import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_PROFILE,
  filterByProfile,
  hasAnsweredProfile,
  profileStore,
  sanitizeProfile,
  switchTrack,
  toggleStack,
  type Profile,
} from "@/lib/stacks";
import { matchesCategory } from "@/lib/categories";
import { getMatchedTopics } from "@/lib/preferences";

const art = (topics: string[]) => ({ topics, title: "t", url: "https://e.x/" + topics.join("-"), source: "s", publishedAt: 0, description: "" });

beforeEach(() => {
  localStorage.clear();
  profileStore.reset();
});

describe("profile", () => {
  it("is unanswered until saved, and defaults to all backend stacks", () => {
    expect(hasAnsweredProfile()).toBe(false);
    expect(DEFAULT_PROFILE.track).toBe("backend");
    expect(DEFAULT_PROFILE.stacks).toEqual(["java_spring", "python", "node", "go", "dotnet"]);
    profileStore.set(DEFAULT_PROFILE);
    expect(hasAnsweredProfile()).toBe(true);
  });

  it("rejects junk and drops stacks that don't fit the track", () => {
    expect(sanitizeProfile({ track: "mobile" })).toBeNull();
    expect(sanitizeProfile({ track: "frontend", stacks: ["react", "java_spring"] })?.stacks).toEqual(["react"]);
  });

  it("full-stack keeps your backend picks and adds frontend stacks", () => {
    const p = switchTrack({ track: "backend", stacks: ["python"] }, "fullstack");
    expect(p.stacks).toContain("python");
    expect(p.stacks).toContain("react");
    expect(p.stacks).not.toContain("java_spring");
  });

  it("never lets you untick the last stack of a side", () => {
    const one: Profile = { track: "backend", stacks: ["go"] };
    expect(toggleStack(one, "go")).toBe(one);
    expect(toggleStack(one, "python").stacks).toEqual(["python", "go"]);
  });
});

describe("filterByProfile", () => {
  const python: Profile = { track: "backend", stacks: ["python"] };

  it("hides other stacks but keeps shared and untagged articles", () => {
    const list = [art(["python"]), art(["java"]), art(["react"]), art(["kubernetes"]), art([]), art(["java", "python"])];
    const kept = filterByProfile(list, python).map((a) => a.topics.join("+"));
    expect(kept).toEqual(["python", "kubernetes", "", "java+python"]);
  });

  it("stack chips filter to one stack", () => {
    expect(matchesCategory(art(["fastapi"]), "stack:python")).toBe(true);
    expect(matchesCategory(art(["java"]), "stack:python")).toBe(false);
  });
});

describe("stack topic detection", () => {
  it("matches tech names but not everyday words", () => {
    expect(getMatchedTopics("Getting started with Go 1.24", "")).toContain("golang");
    expect(getMatchedTopics("Let us go home", "")).not.toContain("golang");
    expect(getMatchedTopics("React Server Components", "")).toContain("react");
    expect(getMatchedTopics("How markets react", "")).not.toContain("react");
  });
});
