import { describe, it, expect, beforeEach } from "vitest";
import {
  getSavedPreferences,
  savePreferences,
  getDefaultPreferences,
  getMatchedTopics,
  filterByTopicPreferences,
} from "@/lib/preferences";

beforeEach(() => {
  localStorage.clear();
});

describe("preferences.ts utilities", () => {
  it("returns all true preferences by default", () => {
    const defaults = getDefaultPreferences();
    expect(defaults.java).toBe(true);
    expect(defaults.spring_boot).toBe(true);

    const saved = getSavedPreferences();
    expect(saved).toEqual(defaults);
  });

  it("saves and retrieves modified preferences", () => {
    const customPrefs = getDefaultPreferences();
    customPrefs.java = false;
    customPrefs.spring_boot = false;
    customPrefs.kafka = true;

    savePreferences(customPrefs);

    const loaded = getSavedPreferences();
    expect(loaded.java).toBe(false);
    expect(loaded.spring_boot).toBe(false);
    expect(loaded.kafka).toBe(true);
  });

  describe("getMatchedTopics", () => {
    it("identifies matching topics from title and description", () => {
      const title = "Setting up a Kafka broker";
      const desc = "A comprehensive guide to Spring Boot microservices integration.";
      
      const matched = getMatchedTopics(title, desc);
      expect(matched).toContain("kafka");
      expect(matched).toContain("spring_boot");
      expect(matched).toContain("microservices");
      expect(matched).not.toContain("java");
    });

    it("handles Java vs JavaScript correctly", () => {
      const matchJava = getMatchedTopics("Learn Java programming", "");
      expect(matchJava).toContain("java");

      const matchJS = getMatchedTopics("Modern JavaScript tips", "");
      expect(matchJS).not.toContain("java");
    });
  });

  describe("filterByTopicPreferences", () => {
    const articles = [
      { title: "Art 1", topics: ["java"] },
      { title: "Art 2", topics: ["kafka"] },
      { title: "Art 3", topics: ["security"] },
    ];

    it("keeps all articles if all preferences are enabled", () => {
      const prefs = getDefaultPreferences();
      expect(filterByTopicPreferences(articles, prefs)).toHaveLength(3);
    });

    it("filters out disabled topics", () => {
      const prefs = getDefaultPreferences();
      prefs.java = false;
      prefs.kafka = false;
      
      const filtered = filterByTopicPreferences(articles, prefs);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Art 3");
    });

    it("defaults to showing all articles if no topics are enabled/selected", () => {
      const prefs = getDefaultPreferences();
      // Set all keys to false
      for (const k of Object.keys(prefs)) {
        prefs[k as keyof typeof prefs] = false;
      }
      expect(filterByTopicPreferences(articles, prefs)).toHaveLength(3);
    });
  });
});
