const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
