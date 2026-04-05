import { AIProvider, Grade } from "./types";

export interface HistoryEntry {
  url: string;
  company: string;
  overall_grade: Grade;
  overall_score: number;
  provider: AIProvider;
  timestamp: number;
}

const STORAGE_KEY = "ycworthy_history";
const MAX_ENTRIES = 8;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(entry: HistoryEntry): void {
  const history = getHistory().filter((h) => h.url !== entry.url);
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
