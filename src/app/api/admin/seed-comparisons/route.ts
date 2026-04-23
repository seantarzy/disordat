import { NextRequest } from 'next/server'
import { SEED_COMPARISONS } from '@/lib/seedComparisons'
import { buildComparisonSlug } from '@/lib/slug'
import { getComparison } from '@/lib/comparisons'

export const runtime = 'nodejs'

const DEFAULT_BATCH = 5

/**
 * Paginated seeder. Netlify's default function timeout is 10s (26s on Pro),
 * so we seed a few pairs per call and the caller iterates.
 *
 * Trigger one batch:
 *   curl -X POST "https://disordat.org/api/admin/seed-comparisons?offset=0&limit=5" \
 *        -H "X-Admin-Secret: $ADMIN_SECRET"
 *
 * The response includes `nextOffset`. Keep calling with that offset until
 * `done: true`. Safe to re-run: already-cached comparisons are skipped.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_SECRET
  if (!expected) {
    return Response.json({ error: 'ADMIN_SECRET not configured' }, { status: 500 })
  }
  const provided = req.headers.get('x-admin-secret')
  if (provided !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0)
  const limit = Math.min(
    20,
    Math.max(1, parseInt(url.searchParams.get('limit') || String(DEFAULT_BATCH), 10) || DEFAULT_BATCH),
  )

  const batch = SEED_COMPARISONS.slice(offset, offset + limit)
  const origin = url.origin

  const results: { pair: string; slug: string; status: 'cached' | 'created' | 'error'; error?: string }[] = []
  let created = 0
  let skipped = 0
  let failed = 0

  for (const [a, b] of batch) {
    const slug = buildComparisonSlug(a, b)
    const existing = await getComparison(slug)
    if (existing) {
      skipped++
      results.push({ pair: `${a} vs ${b}`, slug, status: 'cached' })
      continue
    }

    try {
      const res = await fetch(`${origin}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dis: a, dat: b }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        failed++
        results.push({ pair: `${a} vs ${b}`, slug, status: 'error', error: `${res.status}: ${text.slice(0, 120)}` })
        continue
      }
      created++
      results.push({ pair: `${a} vs ${b}`, slug, status: 'created' })
    } catch (err) {
      failed++
      results.push({
        pair: `${a} vs ${b}`,
        slug,
        status: 'error',
        error: err instanceof Error ? err.message : 'unknown error',
      })
    }
  }

  const nextOffset = offset + batch.length
  const done = nextOffset >= SEED_COMPARISONS.length

  return Response.json({
    batch: { offset, limit, size: batch.length },
    totalSeeds: SEED_COMPARISONS.length,
    created,
    skipped,
    failed,
    nextOffset,
    done,
    results,
  })
}
