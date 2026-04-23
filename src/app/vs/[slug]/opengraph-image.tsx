import { ImageResponse } from 'next/og'
import { getComparison } from '@/lib/comparisons'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Comparison verdict on disordat'

type RouteParams = { slug: string }

export default async function OGImage({ params }: { params: RouteParams }) {
  const { slug } = params
  const c = await getComparison(slug)

  if (!c) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0fdf4',
            fontSize: 64,
            fontWeight: 700,
            color: '#065f46',
          }}
        >
          disordat
        </div>
      ),
      size,
    )
  }

  const winnerLabel =
    c.winner === 'tie' ? 'Too close to call' : c.winner === 'a' ? c.item_a : c.item_b
  const winnerIsTie = c.winner === 'tie'

  // Size the main items based on length so long names don't overflow
  const longestLen = Math.max(c.item_a.length, c.item_b.length)
  const itemFontSize = longestLen > 24 ? 64 : longestLen > 14 ? 82 : 100

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #ecfdf5 0%, #ffffff 55%, #f0f9ff 100%)',
          padding: '60px 72px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 28,
            fontWeight: 700,
            color: '#065f46',
            letterSpacing: '-0.01em',
          }}
        >
          disordat
        </div>

        {/* Matchup */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 40px',
          }}
        >
          <div
            style={{
              fontSize: itemFontSize,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              display: 'flex',
            }}
          >
            {c.item_a}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: '#94a3b8',
              margin: '14px 0',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            vs
          </div>
          <div
            style={{
              fontSize: itemFontSize,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              display: 'flex',
            }}
          >
            {c.item_b}
          </div>

          {/* Winner badge */}
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: winnerIsTie ? '#1e293b' : '#065f46',
              color: 'white',
              padding: '14px 28px',
              borderRadius: 999,
              fontSize: 28,
              fontWeight: 600,
              boxShadow: '0 10px 25px -10px rgba(6,95,70,0.4)',
            }}
          >
            <span style={{ color: '#a7f3d0', fontSize: 22 }}>
              {winnerIsTie ? '⚖︎ Verdict' : '★ Winner'}
            </span>
            <span
              style={{
                maxWidth: 800,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
              }}
            >
              {winnerLabel}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex' }}>Compare anything. Share the verdict.</div>
          <div style={{ display: 'flex', fontWeight: 600, color: '#0f172a' }}>disordat.org</div>
        </div>
      </div>
    ),
    size,
  )
}
