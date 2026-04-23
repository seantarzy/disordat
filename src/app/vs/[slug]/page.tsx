import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getComparison,
  listRecentComparisonSlugs,
  type ComparisonDimension,
  type StoredComparison,
} from '@/lib/comparisons'
import ShareButtons from '@/components/ShareButtons'

const SITE_URL = 'https://disordat.com'

type RouteParams = { slug: string }

function winnerLabelFor(c: StoredComparison): string {
  if (c.winner === 'tie') return 'Too close to call'
  return c.winner === 'a' ? c.item_a : c.item_b
}

function loserLabelFor(c: StoredComparison): string {
  if (c.winner === 'tie') return ''
  return c.winner === 'a' ? c.item_b : c.item_a
}

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { slug } = params
  const comparison = await getComparison(slug)
  if (!comparison) {
    return {
      title: 'Comparison not found · disordat',
      robots: { index: false, follow: false },
    }
  }

  const title = `${comparison.item_a} vs ${comparison.item_b}: Side-by-Side Comparison`
  const shortTitle = `${comparison.item_a} vs ${comparison.item_b}`
  const url = `${SITE_URL}/vs/${slug}`
  const ogImage = `${SITE_URL}/vs/${slug}/opengraph-image`
  const description = comparison.summary

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: shortTitle,
      description,
      url,
      siteName: 'disordat',
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: shortTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: shortTitle,
      description,
      images: [ogImage],
    },
  }
}

export default async function ComparisonPage({ params }: { params: RouteParams }) {
  const { slug } = params
  const c = await getComparison(slug)
  if (!c) notFound()

  const pageUrl = `${SITE_URL}/vs/${slug}`
  const winnerLabel = winnerLabelFor(c)
  const loserLabel = loserLabelFor(c)

  const [related] = await Promise.all([findRelatedComparisons(c)])

  // FAQ entries — phrased in the exact shapes users type into Google.
  // "Should I buy X or Y", "Is X better than Y", "What's the difference between X and Y"
  const faqs = buildFaqs(c)

  // Schema.org FAQPage JSON-LD — this is what earns "People Also Ask" rich snippets.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  // Article schema helps the page register as a real comparison article.
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${c.item_a} vs ${c.item_b}`,
    description: c.summary,
    url: pageUrl,
    datePublished: c.created_at,
    dateModified: c.created_at,
    author: { '@type': 'Organization', name: 'disordat' },
    publisher: {
      '@type': 'Organization',
      name: 'disordat',
      url: SITE_URL,
    },
    about: [
      { '@type': 'Thing', name: c.item_a },
      { '@type': 'Thing', name: c.item_b },
    ],
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* Top nav */}
        <div className="mb-6 flex items-center justify-between text-sm">
          <Link href="/" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors">
            ← disordat
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-white font-medium hover:bg-emerald-700 transition-colors"
          >
            Compare your own
          </Link>
        </div>

        {/* Single-line H1 for crawlers */}
        <h1 className="text-center text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          {c.item_a} <span className="text-slate-400 font-semibold">vs</span> {c.item_b}
        </h1>

        {/* Answer-first verdict card */}
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">
            The verdict
          </div>
          <div className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
            {c.winner === 'tie' ? (
              <>It&rsquo;s too close to call.</>
            ) : (
              <>
                <span className="text-emerald-700">{winnerLabel}</span> wins.
              </>
            )}
          </div>
          <p className="mt-3 text-base md:text-lg text-slate-700 leading-relaxed">{c.summary}</p>
        </section>

        {/* Share buttons — important moment of truth */}
        <div className="mt-6">
          <ShareButtons url={pageUrl} summary={c.summary} itemA={c.item_a} itemB={c.item_b} />
        </div>

        {/* Side-by-side dimensions */}
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 text-center">
            Head-to-head
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
              <div className="p-4 text-sm font-semibold text-slate-900 text-center border-b border-slate-200 bg-slate-50">
                {c.item_a}
              </div>
              <div className="p-4 text-xs font-medium text-slate-500 text-center border-b border-slate-200 bg-slate-50 border-x">
                category
              </div>
              <div className="p-4 text-sm font-semibold text-slate-900 text-center border-b border-slate-200 bg-slate-50">
                {c.item_b}
              </div>
              {c.dimensions.map((d, i) => (
                <DimensionRow key={i} dim={d} isLast={i === c.dimensions.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* Pros */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <ProsCard title={c.item_a} pros={c.pros_a} isWinner={c.winner === 'a'} />
          <ProsCard title={c.item_b} pros={c.pros_b} isWinner={c.winner === 'b'} />
        </section>

        {/* Why */}
        <section className="mt-8 rounded-2xl bg-slate-50 border border-slate-200 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Why {winnerLabel} {c.winner === 'tie' ? '' : 'wins'}
          </h2>
          <p className="text-slate-800 leading-relaxed">{c.winner_reason}</p>
        </section>

        {/* FAQ — written in the exact phrasings people type into Google */}
        <section className="mt-10">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Frequently asked</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900 mb-2">{f.q}</h3>
                <p className="text-slate-700 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related comparisons — internal linking for crawlers + humans */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Related comparisons</h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/vs/${r.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                  >
                    <span className="text-sm text-slate-800 truncate">
                      {r.item_a} <span className="text-slate-400">vs</span> {r.item_b}
                    </span>
                    <span className="text-emerald-600 shrink-0">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Share again at bottom */}
        <div className="mt-10">
          <ShareButtons url={pageUrl} summary={c.summary} itemA={c.item_a} itemB={c.item_b} />
        </div>

        <footer className="mt-10 text-center text-xs text-slate-400 pb-8">
          Generated by <Link href="/" className="underline hover:text-emerald-600">disordat</Link>.
          Compare anything — every comparison gets its own shareable page.
        </footer>
      </div>
    </main>
  )
}

function DimensionRow({ dim, isLast }: { dim: ComparisonDimension; isLast: boolean }) {
  const border = isLast ? '' : 'border-b border-slate-200'
  return (
    <>
      <div className={`p-4 text-sm text-slate-800 ${border} ${dim.winner === 'a' ? 'bg-emerald-50' : ''}`}>
        <div className="flex items-start gap-2">
          {dim.winner === 'a' && <WinBadge />}
          <span>{dim.a}</span>
        </div>
      </div>
      <div className={`p-4 text-xs font-medium text-slate-500 text-center bg-white border-x border-slate-100 ${border}`}>
        {dim.name}
      </div>
      <div className={`p-4 text-sm text-slate-800 ${border} ${dim.winner === 'b' ? 'bg-emerald-50' : ''}`}>
        <div className="flex items-start gap-2">
          <span>{dim.b}</span>
          {dim.winner === 'b' && <WinBadge />}
        </div>
      </div>
    </>
  )
}

function WinBadge() {
  return (
    <span className="mt-0.5 shrink-0 text-emerald-600" title="Winner in this category">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 15 8l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
      </svg>
    </span>
  )
}

function ProsCard({ title, pros, isWinner }: { title: string; pros: string[]; isWinner: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${
      isWinner
        ? 'border-emerald-300 bg-emerald-50/60'
        : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {isWinner && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
            winner
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {pros.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Build FAQ entries using the exact phrasings users type into Google.
 * Answers are derived from the cached comparison so every page has real content.
 */
function buildFaqs(c: StoredComparison) {
  const tie = c.winner === 'tie'
  const winner = winnerLabelFor(c)
  const loser = loserLabelFor(c)

  const firstAnswer = tie
    ? `${c.item_a} and ${c.item_b} are close enough that it depends on your priorities. ${c.summary}`
    : `${winner}. ${c.winner_reason}`

  const secondAnswer = tie
    ? `It depends on what matters most to you. ${c.summary}`
    : `${winner} comes out ahead overall. ${c.winner_reason}${loser ? ` That said, ${loser} still has real strengths — see the pros lists above.` : ''}`

  const thirdAnswer = `${c.summary}`

  return [
    { q: `Should I pick ${c.item_a} or ${c.item_b}?`, a: firstAnswer },
    { q: `Is ${c.item_a} better than ${c.item_b}?`, a: secondAnswer },
    { q: `What's the difference between ${c.item_a} and ${c.item_b}?`, a: thirdAnswer },
  ]
}

/**
 * Find up to 6 other cached comparisons that share one of the two items.
 * Matching is slug-substring-based — good enough for canonical slug format.
 */
async function findRelatedComparisons(c: StoredComparison): Promise<StoredComparison[]> {
  const [partA, partB] = c.slug.split('-vs-')
  if (!partA || !partB) return []

  const recentSlugs = await listRecentComparisonSlugs(80)
  const candidates = recentSlugs.filter((s) => {
    if (s === c.slug) return false
    // Share one (and only one) of the two parts — same item, different opponent.
    const hitsA = s.includes(partA)
    const hitsB = s.includes(partB)
    return (hitsA && !hitsB) || (hitsB && !hitsA)
  })

  const related: StoredComparison[] = []
  for (const s of candidates.slice(0, 20)) {
    if (related.length >= 6) break
    const stored = await getComparison(s)
    if (stored) related.push(stored)
  }
  return related
}
