// src/utils/apiObservability.ts
export type ApiObservation = {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

const STORAGE_KEY = "api_observations";

export function getApiObservations(): ApiObservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveApiObservation(event: ApiObservation) {
  const current = getApiObservations();
  const next = [event, ...current].slice(0, 200);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearApiObservations() {
  localStorage.removeItem(STORAGE_KEY);
}