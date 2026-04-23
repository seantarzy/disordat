'use client'

import { useState } from 'react'
import { trackShareClick } from '@/lib/analytics'

interface Props {
  url: string
  summary: string
  itemA: string
  itemB: string
}

export default function ShareButtons({ url, summary, itemA, itemB }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackShareClick({ method: 'copy_link', content_type: 'comparison', content_id: url })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard may be blocked; silent fail is fine */
    }
  }

  const twitterIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${itemA} vs ${itemB} — ${summary}`
  )}&url=${encodeURIComponent(url)}`

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
          copied
            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
            : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
        }`}
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Link copied!
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy link
          </>
        )}
      </button>
      <a
        href={twitterIntent}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackShareClick({ method: 'twitter', content_type: 'comparison', content_id: url })}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-black hover:text-black"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Share on X
      </a>
    </div>
  )
}
