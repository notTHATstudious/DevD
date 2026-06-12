export type DevUser = {
  username: string;
  tag: string; // e.g. "Dev"
};

const USERS_KEY = "dailyd_users"; // {username: {salt, hash}}
const SESSION_KEY = "dailyd_session"; // current username
const TAG_KEY = "dailyd_tag"; // cached random tag per session
const SESSION_LOGIN_AT_KEY = "dailyd_session_at"; // login timestamp (ms)

/** Session lifetime — 7 days. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const TAGS = ["Dev", "Coder", "Hacker", "Builder", "Engineer", "Maker", "Shipper", "Tinkerer"];

type StoredCredential = { salt: string; hash: string };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

// Salted SHA-256. Still NOT real security (runs client-side, visible in
// devtools) — but prevents rainbow-table lookups if localStorage is dumped.
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder().encode(`${salt}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return bytesToHex(new Uint8Array(buf));
}

function readUsers(): Record<string, StoredCredential | string> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredCredential>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function pickRandomTag(): string {
  return TAGS[Math.floor(Math.random() * TAGS.length)];
}

function readLoginAt(): number | null {
  const raw = localStorage.getItem(SESSION_LOGIN_AT_KEY);
  if (!raw) return null;
  const loginAt = Number(raw);
  return Number.isFinite(loginAt) ? loginAt : null;
}

export function isSessionExpired(loginAt: number | null, now = Date.now()): boolean {
  if (loginAt === null) return true;
  return now - loginAt > SESSION_TTL_MS;
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TAG_KEY);
  localStorage.removeItem(SESSION_LOGIN_AT_KEY);
}

export async function signUp(username: string, password: string): Promise<void> {
  const u = username.trim().toLowerCase();
  if (!/^[a-z0-9_.-]{2,20}$/.test(u)) {
    throw new Error("Username must be 2–20 chars (letters, numbers, . _ -).");
  }
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (password.length > 200) throw new Error("Password is too long.");
  const users = readUsers() as Record<string, StoredCredential>;
  if (users[u]) throw new Error("That username is already taken on this device.");
  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  users[u] = { salt, hash };
  writeUsers(users);
  startSession(u);
}

export async function signIn(username: string, password: string): Promise<void> {
  const u = username.trim().toLowerCase();
  const users = readUsers();
  const record = users[u];
  if (!record) throw new Error("No account with that username on this device.");

  // Support legacy (pre-salt) accounts: stored as a plain hex string.
  if (typeof record === "string") {
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const legacy = bytesToHex(new Uint8Array(buf));
    if (legacy !== record) throw new Error("Incorrect password.");
    // Upgrade to salted storage on successful legacy login.
    const salt = randomSalt();
    const hash = await hashPassword(password, salt);
    const upgraded = { ...(users as Record<string, StoredCredential>), [u]: { salt, hash } };
    writeUsers(upgraded);
    startSession(u);
    return;
  }

  const got = await hashPassword(password, record.salt);
  if (got !== record.hash) throw new Error("Incorrect password.");
  startSession(u);
}

function startSession(username: string) {
  localStorage.setItem(SESSION_KEY, username);
  localStorage.setItem(TAG_KEY, pickRandomTag());
  localStorage.setItem(SESSION_LOGIN_AT_KEY, String(Date.now()));
}

export function signOut() {
  clearSession();
}

export function getCurrentUser(): DevUser | null {
  const username = localStorage.getItem(SESSION_KEY);
  if (!username) return null;

  const loginAt = readLoginAt();
  if (isSessionExpired(loginAt)) {
    clearSession();
    return null;
  }

  let tag = localStorage.getItem(TAG_KEY);
  if (!tag) {
    tag = pickRandomTag();
    localStorage.setItem(TAG_KEY, tag);
  }
  return { username, tag };
}
