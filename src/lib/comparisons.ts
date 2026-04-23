import { Redis } from '@upstash/redis'

export type DimensionWinner = 'a' | 'b' | 'tie'

export interface ComparisonDimension {
  name: string
  a: string
  b: string
  winner: DimensionWinner
}

/**
 * Everything we persist for a comparison. `item_a` / `item_b` are stored in
 * their canonical alphabetical order (the same order as the slug), so the
 * payload is symmetric — anyone hitting /vs/<slug> sees the same thing.
 */
export interface StoredComparison {
  slug: string
  item_a: string
  item_b: string
  summary: string              // one-line verdict, great for share previews
  winner: 'a' | 'b' | 'tie'
  winner_reason: string        // 1-2 sentences explaining the pick
  dimensions: ComparisonDimension[]
  pros_a: string[]
  pros_b: string[]
  created_at: string
}

const KEY_PREFIX = 'cmp:'
const RECENT_KEY = 'cmp:recent'

let _redis: Redis | null = null
function redis(): Redis {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('Upstash Redis env vars missing (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)')
  }
  _redis = new Redis({ url, token })
  return _redis
}

export async function getComparison(slug: string): Promise<StoredComparison | null> {
  try {
    const data = await redis().get<StoredComparison>(`${KEY_PREFIX}${slug}`)
    return data ?? null
  } catch (err) {
    console.error('getComparison failed:', err)
    return null
  }
}

export async function saveComparison(c: StoredComparison): Promise<void> {
  try {
    await redis().set(`${KEY_PREFIX}${c.slug}`, c)
    // Recent list: trim to 50 most recent
    await redis().lpush(RECENT_KEY, c.slug)
    await redis().ltrim(RECENT_KEY, 0, 49)
  } catch (err) {
    console.error('saveComparison failed:', err)
  }
}

export async function listRecentComparisonSlugs(limit = 20): Promise<string[]> {
  try {
    return await redis().lrange<string>(RECENT_KEY, 0, limit - 1)
  } catch (err) {
    console.error('listRecentComparisonSlugs failed:', err)
    return []
  }
}
