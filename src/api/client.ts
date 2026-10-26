const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/** Free hosting can take ~30s to wake up; give up after this long. */
const REQUEST_TIMEOUT_MS = 45_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  // Only send Content-Type when there is a body. On a GET it turns the request
  // into a "non-simple" CORS request, which costs an extra OPTIONS round trip.
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onOuterAbort);

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    if (!response.ok) {
      throw new ApiError(
        response.status === 503
          ? "The server is starting up. Retrying…"
          : `API Error: ${response.status} ${response.statusText}`,
        response.status,
      );
    }
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError" && !options?.signal?.aborted) {
      throw new ApiError("The server took too long to respond.", 0);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
    options?.signal?.removeEventListener("abort", onOuterAbort);
  }
}
