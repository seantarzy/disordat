export interface ComparisonHistory {
  id: string;
  dis: string;
  dat: string;
  verdict: "dis" | "dat" | "shrug";
  reasoning: string;
  timestamp: number;
}

const HISTORY_KEY = "disordat_history";
const MAX_HISTORY_SIZE = 100;

class LRUCache {
  private cache = new Map<string, ComparisonHistory>();

  set(key: string, value: ComparisonHistory): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= MAX_HISTORY_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  get(key: string): ComparisonHistory | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  values(): ComparisonHistory[] {
    return Array.from(this.cache.values()).reverse(); // Most recent first
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  entries(): [string, ComparisonHistory][] {
    return Array.from(this.cache.entries());
  }
}

export function saveToHistory(comparison: Omit<ComparisonHistory, "id" | "timestamp">): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  try {
    const history = getHistory();
    const id = `${comparison.dis}|${comparison.dat}|${Date.now()}`;
    const historyItem: ComparisonHistory = {
      ...comparison,
      id,
      timestamp: Date.now(),
    };

    history.set(id, historyItem);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.entries()));
    
    // Dispatch custom event to notify components that history has been updated
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("history-updated"));
    }
  } catch (error) {
    console.error("Failed to save to history:", error);
  }
}

export function getHistory(): LRUCache {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return new LRUCache();

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return new LRUCache();

    const entries = JSON.parse(stored) as [string, ComparisonHistory][];
    const cache = new LRUCache();
    
    // Reconstruct the cache in order (oldest first)
    entries.forEach(([key, value]) => {
      cache.set(key, value);
    });

    return cache;
  } catch (error) {
    console.error("Failed to load history:", error);
    return new LRUCache();
  }
}

export function removeFromHistory(id: string): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  try {
    const history = getHistory();
    history.delete(id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.entries()));
    
    // Dispatch custom event to notify components that history has been updated
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("history-updated"));
    }
  } catch (error) {
    console.error("Failed to remove from history:", error);
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  try {
    localStorage.removeItem(HISTORY_KEY);
    
    // Dispatch custom event to notify components that history has been updated
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("history-updated"));
    }
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}
