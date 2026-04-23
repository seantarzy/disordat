// Lightweight client-side list of "comparisons this browser has made".
// Used to show a recent list on the homepage so returning visitors can
// pick up where they left off.

export interface RecentComparison {
  slug: string
  item_a: string
  item_b: string
  winner_label: string
  created_at: number
}

const KEY = 'disordat_recent_v2'
const MAX = 20

export function getRecentComparisons(): RecentComparison[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addRecentComparison(c: RecentComparison): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentComparisons().filter((r) => r.slug !== c.slug)
    const next = [c, ...existing].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('recent-comparisons-updated'))
  } catch {
    /* ignore */
  }
}
