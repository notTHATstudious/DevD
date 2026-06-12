import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_TTL_MS,
  getCurrentUser,
  isSessionExpired,
  signIn,
  signOut,
  signUp,
} from "@/lib/auth";

const PASSWORD = "password123";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isSessionExpired", () => {
  it("returns false within 7 days", () => {
    const loginAt = Date.now();
    expect(isSessionExpired(loginAt)).toBe(false);
    expect(isSessionExpired(loginAt, loginAt + SESSION_TTL_MS)).toBe(false);
  });

  it("returns true after 7 days", () => {
    const loginAt = Date.now();
    expect(isSessionExpired(loginAt, loginAt + SESSION_TTL_MS + 1)).toBe(true);
  });

  it("returns true when login timestamp is missing", () => {
    expect(isSessionExpired(null)).toBe(true);
  });
});

describe("session expiration", () => {
  it("stores login timestamp on sign up", async () => {
    await signUp("alice", PASSWORD);
    expect(localStorage.getItem("dailyd_session_at")).toBe(String(Date.now()));
    expect(getCurrentUser()?.username).toBe("alice");
  });

  it("stores login timestamp on sign in", async () => {
    await signUp("alice", PASSWORD);
    signOut();
    localStorage.removeItem("dailyd_session_at");

    await signIn("alice", PASSWORD);
    expect(localStorage.getItem("dailyd_session_at")).toBe(String(Date.now()));
  });

  it("auto logs out expired sessions", async () => {
    await signUp("alice", PASSWORD);
    vi.advanceTimersByTime(SESSION_TTL_MS + 1);

    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem("dailyd_session")).toBeNull();
    expect(localStorage.getItem("dailyd_tag")).toBeNull();
    expect(localStorage.getItem("dailyd_session_at")).toBeNull();
  });

  it("keeps session valid just before expiry", async () => {
    await signUp("alice", PASSWORD);
    vi.advanceTimersByTime(SESSION_TTL_MS);

    expect(getCurrentUser()?.username).toBe("alice");
  });

  it("logs out legacy sessions without login timestamp", () => {
    localStorage.setItem("dailyd_session", "alice");
    localStorage.setItem("dailyd_tag", "Dev");

    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem("dailyd_session")).toBeNull();
  });

  it("clears login timestamp on sign out", async () => {
    await signUp("alice", PASSWORD);
    signOut();

    expect(localStorage.getItem("dailyd_session_at")).toBeNull();
  });
});
