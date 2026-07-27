export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  const token = await (await import("@/lib/firebase")).getFirebaseIdToken();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || "Request failed");
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}
