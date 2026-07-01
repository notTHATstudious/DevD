import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PWA_STANDALONE_CLASS,
  STANDALONE_VIEWPORT,
  applyPwaStandaloneMode,
  isStandalone,
} from "@/lib/pwaStandalone";

function setViewportMeta(content: string): void {
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "viewport");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

beforeEach(() => {
  document.documentElement.className = "";
  setViewportMeta("width=device-width, initial-scale=1.0, viewport-fit=cover");
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
  Object.defineProperty(navigator, "standalone", {
    configurable: true,
    value: undefined,
    writable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isStandalone", () => {
  it("returns false in normal browser mode", () => {
    expect(isStandalone()).toBe(false);
  });

  it("returns true for display-mode standalone", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(display-mode: standalone)",
      })),
    );
    expect(isStandalone()).toBe(true);
  });

  it("returns true for iOS navigator.standalone", () => {
    Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
    expect(isStandalone()).toBe(true);
  });
});

describe("applyPwaStandaloneMode", () => {
  it("does nothing in normal browser mode", () => {
    applyPwaStandaloneMode();
    expect(document.documentElement.classList.contains(PWA_STANDALONE_CLASS)).toBe(false);
    expect(document.querySelector('meta[name="viewport"]')?.getAttribute("content")).toBe(
      "width=device-width, initial-scale=1.0, viewport-fit=cover",
    );
  });

  it("adds class and updates viewport in standalone mode", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(display-mode: standalone)",
      })),
    );

    applyPwaStandaloneMode();

    expect(document.documentElement.classList.contains(PWA_STANDALONE_CLASS)).toBe(true);
    expect(document.querySelector('meta[name="viewport"]')?.getAttribute("content")).toBe(
      STANDALONE_VIEWPORT,
    );
  });

  it("preserves viewport-fit=cover for safe areas", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(display-mode: standalone)",
      })),
    );

    applyPwaStandaloneMode();

    expect(STANDALONE_VIEWPORT).toContain("viewport-fit=cover");
  });
});
