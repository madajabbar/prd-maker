import { DEFAULT_PROVIDER, PROVIDERS, type ProviderId } from "./providers";
import type { PrdLanguage } from "./prompts";

export interface HistoryItem {
  id: string;
  title: string;
  createdAt: number;
  language: PrdLanguage;
  content: string;
  shareId?: string;
}

export const HISTORY_CAP = 25;

const KEYS_KEY = "prdmaker:keys";
const MODEL_KEY = "prdmaker:model";
const HISTORY_KEY = "prdmaker:history";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full/blocked: ignore
  }
}

export function loadKeys(): Partial<Record<ProviderId, string>> {
  return readJson<Partial<Record<ProviderId, string>>>(KEYS_KEY, {});
}

export function saveKey(provider: ProviderId, apiKey: string) {
  const keys = loadKeys();
  keys[provider] = apiKey;
  writeJson(KEYS_KEY, keys);
}

export function loadModel(): { provider: ProviderId; model: string } {
  const saved = readJson<{ provider?: string; model?: string }>(MODEL_KEY, {});
  const provider =
    typeof saved.provider === "string" && saved.provider in PROVIDERS
      ? (saved.provider as ProviderId)
      : DEFAULT_PROVIDER;
  const fallback = PROVIDERS[provider].defaultModel;
  return { provider, model: saved.model || fallback };
}

export function saveModel(provider: ProviderId, model: string) {
  writeJson(MODEL_KEY, { provider, model });
}

export function loadHistory(): HistoryItem[] {
  return readJson<HistoryItem[]>(HISTORY_KEY, []);
}

export function addToHistory(item: HistoryItem): HistoryItem[] {
  const next = [item, ...loadHistory().filter((h) => h.id !== item.id)].slice(
    0,
    HISTORY_CAP,
  );
  writeJson(HISTORY_KEY, next);
  return next;
}

export function updateHistory(
  id: string,
  patch: Partial<Omit<HistoryItem, "id">>,
): HistoryItem[] {
  const next = loadHistory().map((h) =>
    h.id === id ? { ...h, ...patch } : h,
  );
  writeJson(HISTORY_KEY, next);
  return next;
}

export function removeFromHistory(id: string): HistoryItem[] {
  const next = loadHistory().filter((h) => h.id !== id);
  writeJson(HISTORY_KEY, next);
  return next;
}
