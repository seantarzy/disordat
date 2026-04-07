# disordat — Data Dive Site

This is **disordat**, an AI-powered "this or that" decision tool. It's part of [Operation Data Dive](https://data-dive-sean-tarzys-projects.vercel.app) — Sean's cross-site analytics framework.

## Quick stats lookup

Before answering questions about traffic, engagement, or user behavior, fetch live data:
```bash
API_KEY=$(grep API_KEY ~/Development/code/data-dive/.env.local | cut -d= -f2)
curl -s -H "X-API-Key: $API_KEY" "https://data-dive-sean-tarzys-projects.vercel.app/api/status/disordat?period=7d"
```

## Site facts

- **GA4 property:** `properties/501532712` (measurement ID `G-YGJCLVHHMP`)
- **Category:** interactive-tool
- **Framework:** Next.js 14 App Router
- **Analytics module:** `src/lib/analytics.ts` — gold standard implementation with the original `trackDecision`/`trackGenieInteraction` PLUS the unified Data Dive Tier 1 + Tier 2 (interactive-tool) events
- **Tracked events:** `decision_made`, `genie_interaction`, plus all Tier 1 universal events and `tool_use`, `result_generated`

## Site-specific gotchas

- This site had analytics first — has the most mature instrumentation of all 8 sites
- History clear/remove actions track via `trackToolUse('history', ...)`

For full Data Dive context see `~/.claude/CLAUDE.md`.
