import HomeClient, { type TrendingItem } from './HomeClient'
import { getComparison, listRecentComparisonSlugs } from '@/lib/comparisons'

// Re-fetch trending data every 10 minutes so Google sees fresh internal links
// without hammering KV on every request.
export const revalidate = 600

export default async function HomePage() {
  const trending = await loadTrending()
  return <HomeClient trending={trending} />
}

async function loadTrending(): Promise<TrendingItem[]> {
  try {
    const slugs = await listRecentComparisonSlugs(12)
    const items: TrendingItem[] = []
    for (const slug of slugs) {
      const c = await getComparison(slug)
      if (!c) continue
      items.push({
        slug: c.slug,
        item_a: c.item_a,
        item_b: c.item_b,
        winner_label:
          c.winner === 'tie' ? 'Too close' : c.winner === 'a' ? c.item_a : c.item_b,
      })
      if (items.length >= 10) break
    }
    return items
  } catch {
    return []
  }
}
