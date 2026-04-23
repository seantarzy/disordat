'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trackDecision, trackGenieInteraction, trackToolUse } from '@/lib/analytics'
import { addRecentComparison, getRecentComparisons, type RecentComparison } from '@/lib/recentComparisons'

// A generous pool. We show 5 at a time and shuffle to show more.
// Tilted toward real purchase decisions — that's the sharpest use case.
const EXAMPLE_POOL: Array<[string, string]> = [
  // Tech / purchase
  ['MacBook Air M3', 'Framework Laptop 13'],
  ['iPhone 15 Pro', 'Pixel 8 Pro'],
  ['Sony WH-1000XM5', 'Bose QuietComfort Ultra'],
  ['Kindle Paperwhite', 'Boox Go 10.3'],
  ['Roomba j9+', 'Shark Matrix'],
  ['AirPods Pro 2', 'Beats Fit Pro'],
  ['Tesla Model Y', 'Hyundai Ioniq 5'],
  ['Tesla Model 3', 'Toyota Prius'],
  ['iPad Air', 'iPad Pro'],
  ['Apple Watch Ultra', 'Garmin Fenix 7'],
  ['Steam Deck OLED', 'ROG Ally X'],
  ['PS5', 'Xbox Series X'],
  // Life decisions
  ['Rent in the city', 'Buy in the suburbs'],
  ['Remote job', 'In-office job'],
  ['Adopt a cat', 'Adopt a dog'],
  ['CrossFit', 'Orangetheory'],
  ['Gym membership', 'Peloton'],
  // Food & drink
  ['New York pizza', 'Chicago deep dish'],
  ['In-N-Out', 'Shake Shack'],
  ['Chipotle', 'Cava'],
  ['Starbucks', 'Local third-wave coffee'],
  ['Sushi', 'Ramen'],
  // Travel / places
  ['Tokyo', 'Seoul'],
  ['Lisbon', 'Barcelona'],
  ['Banff', 'Yellowstone'],
  ['Iceland', 'New Zealand'],
  ['Brooklyn', 'Queens'],
  // People / sports
  ['Lionel Messi', 'Cristiano Ronaldo'],
  ['LeBron James', 'Michael Jordan'],
  ['Serena Williams', 'Steffi Graf'],
  ['Paul Skenes', 'Stephen Strasburg'],
  // Media / fictional
  ['Marvel', 'DC'],
  ['Lord of the Rings', 'Game of Thrones'],
  ['Succession', 'Mad Men'],
  ['Minecraft', 'Roblox'],
  // Services / subscriptions
  ['Notion', 'Obsidian'],
  ['Spotify', 'Apple Music'],
  ['Netflix', 'Max'],
  ['ChatGPT Plus', 'Claude Pro'],
  ['Linear', 'Jira'],
]

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const URL_PATTERN = /^https?:\/\//i

export interface TrendingItem {
  slug: string
  item_a: string
  item_b: string
  winner_label: string
}

export default function HomeClient({ trending = [] }: { trending?: TrendingItem[] }) {
  const router = useRouter()
  const [dis, setDis] = useState('')
  const [dat, setDat] = useState('')
  const [unfurlingDis, setUnfurlingDis] = useState(false)
  const [unfurlingDat, setUnfurlingDat] = useState(false)
  const [unfurlSourceDis, setUnfurlSourceDis] = useState<string | null>(null)
  const [unfurlSourceDat, setUnfurlSourceDat] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState<RecentComparison[]>([])
  // Start with the first N of the pool (deterministic so SSR and client agree).
  // Shuffling happens on explicit user click to avoid hydration mismatch.
  const [visibleExamples, setVisibleExamples] = useState<Array<[string, string]>>(
    () => EXAMPLE_POOL.slice(0, 6),
  )

  useEffect(() => {
    const refresh = () => setRecent(getRecentComparisons())
    refresh()
    window.addEventListener('recent-comparisons-updated', refresh)
    return () => window.removeEventListener('recent-comparisons-updated', refresh)
  }, [])

  const unfurlIfUrl = useCallback(
    async (value: string, which: 'dis' | 'dat'): Promise<string> => {
      if (!URL_PATTERN.test(value.trim())) return value
      const setLoadingFlag = which === 'dis' ? setUnfurlingDis : setUnfurlingDat
      const setSource = which === 'dis' ? setUnfurlSourceDis : setUnfurlSourceDat
      const setValue = which === 'dis' ? setDis : setDat
      setLoadingFlag(true)
      setSource(null)
      try {
        const res = await fetch('/api/unfurl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value.trim() }),
        })
        const data = await res.json()
        if (res.ok && data.title) {
          setValue(data.title)
          setSource(data.host || null)
          trackToolUse('unfurl', 'success', data.host)
          return data.title
        } else {
          trackToolUse('unfurl', 'failed', data.error)
          // Leave the URL as-is so the user can edit it or try again
          return value
        }
      } catch {
        return value
      } finally {
        setLoadingFlag(false)
      }
    },
    [],
  )

  async function compare(e?: React.FormEvent) {
    e?.preventDefault()
    if (loading) return
    setError(null)

    // If either field is still a pasted URL at submit time, resolve it first.
    let resolvedDis = dis.trim()
    let resolvedDat = dat.trim()
    if (URL_PATTERN.test(resolvedDis) || URL_PATTERN.test(resolvedDat)) {
      ;[resolvedDis, resolvedDat] = await Promise.all([
        unfurlIfUrl(resolvedDis, 'dis'),
        unfurlIfUrl(resolvedDat, 'dat'),
      ])
    }

    if (!resolvedDis.trim() || !resolvedDat.trim()) return

    setLoading(true)
    trackGenieInteraction('decision_requested')

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dis: resolvedDis.trim(), dat: resolvedDat.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.slug) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      const c = data.comparison
      const winnerLabel =
        c.winner === 'tie' ? 'Too close to call' : c.winner === 'a' ? c.item_a : c.item_b

      addRecentComparison({
        slug: data.slug,
        item_a: c.item_a,
        item_b: c.item_b,
        winner_label: winnerLabel,
        created_at: Date.now(),
      })
      trackDecision(c.item_a, c.item_b, c.winner)
      trackToolUse('compare', 'submit', data.cached ? 'cached' : 'new')

      router.push(`/vs/${data.slug}`)
    } catch (err) {
      console.error(err)
      setError('Network error. Try again?')
      setLoading(false)
    }
  }

  const disabled =
    loading ||
    unfurlingDis ||
    unfurlingDat ||
    !dis.trim() ||
    !dat.trim()

  return (
    <main className="min-h-dvh bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        {/* Hero */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-4">
            decide with confidence
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">disordat</h1>
          <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
            Can&rsquo;t decide between two things to buy or do? Get a real side-by-side with a winner —
            and a link you can paste anywhere.
          </p>
        </header>

        {/* Inputs */}
        <form onSubmit={compare} className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <InputField
            value={dis}
            onChange={setDis}
            onBlur={(v) => unfurlIfUrl(v, 'dis')}
            disabled={loading}
            busy={unfurlingDis}
            source={unfurlSourceDis}
            placeholder="this… (or paste a product URL)"
          />
          <div className="flex items-center justify-center text-sm font-semibold text-slate-400 uppercase tracking-widest">
            vs
          </div>
          <InputField
            value={dat}
            onChange={setDat}
            onBlur={(v) => unfurlIfUrl(v, 'dat')}
            disabled={loading}
            busy={unfurlingDat}
            source={unfurlSourceDat}
            placeholder="…or that"
          />
        </form>

        <p className="mt-3 text-center text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Tip: paste an Amazon or Best Buy link and we&rsquo;ll pull the product name automatically.</span>
          </span>
        </p>

        <div className="mt-5 flex justify-center">
          <button
            onClick={() => compare()}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Deciding…
              </>
            ) : unfurlingDis || unfurlingDat ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Reading link…
              </>
            ) : (
              <>Compare →</>
            )}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {/* Examples with shuffle */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              or try one
            </p>
            <button
              onClick={() => {
                setVisibleExamples(shuffle(EXAMPLE_POOL).slice(0, 6))
                trackGenieInteraction('examples_shuffled')
              }}
              className="inline-flex items-center gap-1 rounded-full text-xs font-medium text-slate-500 hover:text-emerald-700 transition-colors"
              title="Show different examples"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" />
                <path d="M4 20 21 3" />
                <path d="M21 16v5h-5" />
                <path d="m15 15 6 6" />
                <path d="M4 4l5 5" />
              </svg>
              Shuffle
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {visibleExamples.map(([a, b], i) => (
              <button
                key={`${a}-${b}-${i}`}
                onClick={() => {
                  setDis(a)
                  setDat(b)
                  setUnfurlSourceDis(null)
                  setUnfurlSourceDat(null)
                  trackGenieInteraction('example_selected')
                }}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                {a} <span className="text-slate-400">vs</span> {b}
              </button>
            ))}
          </div>
        </div>

        {/* Trending — server-rendered from KV, shared across all visitors.
            Doubles as internal-link fuel for Google to crawl the /vs/ graph. */}
        {trending.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 text-center">
              Trending comparisons
            </h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {trending.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/vs/${t.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                  >
                    <span className="text-sm text-slate-800 truncate">
                      {t.item_a} <span className="text-slate-400">vs</span> {t.item_b}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 shrink-0">
                      {t.winner_label} →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Why disordat */}
        <section className="mt-14 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm p-6 md:p-7">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">
            Why not just ask ChatGPT?
          </h2>
          <div className="grid gap-5 md:grid-cols-3 text-sm">
            <ValueProp
              title="The link is the point"
              body="Every comparison lives at its own URL with a rich preview. Drop it in a group chat or a DM — it shows up as a card, not a wall of text."
            />
            <ValueProp
              title="No prompt crafting"
              body="Two inputs. Go. You don&rsquo;t need to remember to ask for pros and cons, a table, or a verdict — that&rsquo;s just what you get."
            />
            <ValueProp
              title="Your decisions have a home"
              body="Every comparison is saved and indexable, so you can come back to it. Chat history disappears; this doesn&rsquo;t."
            />
          </div>
        </section>

        {/* Recent */}
        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Your recent comparisons
            </h2>
            <ul className="space-y-2">
              {recent.slice(0, 8).map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/vs/${r.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                  >
                    <span className="text-sm text-slate-800 truncate">
                      {r.item_a} <span className="text-slate-400">vs</span> {r.item_b}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 shrink-0">
                      {r.winner_label} →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-16 text-center text-xs text-slate-400">
          Every comparison gets its own shareable page. Paste the link anywhere.
        </footer>
      </div>
    </main>
  )
}

function InputField({
  value,
  onChange,
  onBlur,
  disabled,
  busy,
  source,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onBlur: (v: string) => void
  disabled: boolean
  busy: boolean
  source: string | null
  placeholder: string
}) {
  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 pr-11 text-base md:text-lg placeholder-slate-400 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:opacity-70"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        disabled={disabled || busy}
      />
      {busy && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600" />
      )}
      {!busy && source && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 font-medium"
          title={`Resolved from ${source}`}
        >
          from {source.replace(/^www\./, '')}
        </span>
      )}
    </div>
  )
}

function ValueProp({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{body}</p>
    </div>
  )
}
