import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

// Domain-specific noise strippers. Add more as needed.
const DOMAIN_BOILERPLATE: Array<[RegExp, RegExp]> = [
  [/amazon\./i, /\s*[:|—–\-]\s*(amazon(\.com?)?(\.[a-z]+)?|amazon\.[a-z.]+).*$/i],
  [/bestbuy\./i, /\s*[:|—–\-]\s*best\s*buy.*$/i],
  [/target\./i, /\s*[:|—–\-]\s*target.*$/i],
  [/walmart\./i, /\s*[:|—–\-]\s*walmart.*$/i],
  [/ebay\./i, /\s*[:|—–\-]\s*ebay.*$/i],
  [/bhphotovideo\./i, /\s*[|]\s*b&h\s*photo.*$/i],
  [/apple\.com/i, /\s*[-–—]\s*apple.*$/i],
]

function extractTitle(html: string): string | null {
  // Prefer og:title
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
  if (og?.[1]) return og[1].trim()

  // Then twitter:title
  const tw = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i)
  if (tw?.[1]) return tw[1].trim()

  // Fallback to <title>
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (t?.[1]) return t[1].replace(/\s+/g, ' ').trim()

  return null
}

function cleanTitle(raw: string, host: string): string {
  // HTML entity decode for the common ones
  let t = raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Strip domain-specific boilerplate suffixes
  for (const [hostPattern, stripPattern] of DOMAIN_BOILERPLATE) {
    if (hostPattern.test(host)) {
      t = t.replace(stripPattern, '').trim()
      break
    }
  }

  // Cap length so a giant product title doesn't break the UI
  if (t.length > 120) t = t.slice(0, 120).replace(/\s+\S*$/, '') + '…'
  return t
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (typeof url !== 'string' || !url.trim()) {
      return Response.json({ error: 'Missing url' }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(url.trim())
    } catch {
      return Response.json({ error: 'Not a valid URL' }, { status: 400 })
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return Response.json({ error: 'Only http(s) URLs' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    let html: string
    try {
      const res = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          // Many sites (Amazon, Best Buy) 503 without a realistic UA
          'User-Agent': 'Mozilla/5.0 (compatible; disordat-unfurl/1.0; +https://disordat.com)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      if (!res.ok) {
        return Response.json({ error: `Couldn't read that page (${res.status})` }, { status: 502 })
      }
      // Cap at ~2MB to avoid pulling in a giant product page
      const reader = res.body?.getReader()
      if (!reader) {
        html = await res.text()
      } else {
        const chunks: Uint8Array[] = []
        let total = 0
        const max = 2 * 1024 * 1024
        while (total < max) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          total += value.byteLength
        }
        html = new TextDecoder('utf-8').decode(
          new Uint8Array((() => {
            const merged = new Uint8Array(Math.min(total, max))
            let offset = 0
            for (const c of chunks) {
              if (offset + c.byteLength > max) {
                merged.set(c.slice(0, max - offset), offset)
                break
              }
              merged.set(c, offset)
              offset += c.byteLength
            }
            return merged
          })()),
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error && err.name === 'AbortError' ? 'timed out' : 'fetch failed'
      return Response.json({ error: `Couldn't read that page (${msg})` }, { status: 502 })
    } finally {
      clearTimeout(timeout)
    }

    const rawTitle = extractTitle(html)
    if (!rawTitle) {
      return Response.json({ error: 'No title found on that page' }, { status: 422 })
    }

    const title = cleanTitle(rawTitle, parsed.host)
    if (!title) {
      return Response.json({ error: 'Could not extract a usable title' }, { status: 422 })
    }

    return Response.json({ title, host: parsed.host })
  } catch (err) {
    console.error('Unfurl error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
