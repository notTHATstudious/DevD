const BLOCKED_SCHEME_PREFIXES = [
  "javascript:",
  "data:",
  "file:",
  "blob:",
  "vbscript:",
  "about:",
  "mailto:",
  "tel:",
] as const;

/** Returns true only for absolute https:// URLs with a valid host. */
export function isValidArticleUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  for (const prefix of BLOCKED_SCHEME_PREFIXES) {
    if (lower.startsWith(prefix)) return false;
  }

  // Protocol-relative URLs (//evil.com) are not https.
  if (trimmed.startsWith("//")) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    if (!parsed.hostname) return false;
    return true;
  } catch {
    return false;
  }
}
