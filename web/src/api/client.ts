const API_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  createGame: (data: {
    mode: string;
    hostId: string;
    hostName: string;
    spyCount?: number;
    timerSeconds?: number | null;
  }) => request("/game", { method: "POST", body: JSON.stringify(data) }),

  getGame: (code: string) => request<any>(`/game/${code}`),

  joinGame: (code: string, userId: string, name: string) =>
    request(`/game/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ userId, name }),
    }),

  startGame: (code: string, hostId: string) =>
    request(`/game/${code}/start`, {
      method: "POST",
      body: JSON.stringify({ hostId }),
    }),

  vote: (code: string, userId: string, targetPlayerId: string) =>
    request(`/game/${code}/vote`, {
      method: "POST",
      body: JSON.stringify({ userId, targetPlayerId }),
    }),

  getResults: (code: string) => request<any>(`/game/${code}/results`),

  getLocations: () => request<string[]>("/locations/all"),
};
