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

const TRACKING_PARAM_PREFIXES = ["utm_", "mc_", "fbclid", "gclid", "ref", "source", "cmpid"];

/**
 * Stable key for matching the same article across feeds, bookmarks and read
 * state. Mirrors `normalize_url_key` in the backend: host is lowercased and
 * `www.` dropped, trailing slashes and tracking params are removed, but
 * meaningful params (e.g. WordPress `?p=123`) are kept.
 */
export function normalizeArticleUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const params = Array.from(parsed.searchParams.entries())
      .filter(([k]) => !TRACKING_PARAM_PREFIXES.some((p) => k.toLowerCase().startsWith(p)))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const host = parsed.host.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    const query = params.length ? `?${new URLSearchParams(params).toString()}` : "";
    return `${host}${path}${query}`;
  } catch {
    return trimmed.replace(/\/+$/, "").toLowerCase();
  }
}
