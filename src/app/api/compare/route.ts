import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { buildComparisonSlug } from '@/lib/slug'
import { normalizeForCompare, isNonsense } from '@/lib/normalize'
import {
  getComparison,
  saveComparison,
  type StoredComparison,
} from '@/lib/comparisons'

export const runtime = 'nodejs' // Upstash SDK needs fetch (works on edge too, but node is safer for now)

const LLMComparisonSchema = z.object({
  summary: z.string().min(1).max(220),
  winner: z.enum(['a', 'b', 'tie']),
  winner_reason: z.string().min(1).max(400),
  dimensions: z.array(z.object({
    name: z.string().min(1).max(40),
    a: z.string().min(1).max(200),
    b: z.string().min(1).max(200),
    winner: z.enum(['a', 'b', 'tie']),
  })).min(2).max(6),
  pros_a: z.array(z.string().min(1).max(120)).min(1).max(5),
  pros_b: z.array(z.string().min(1).max(120)).min(1).max(5),
})

type Body = {
  dis: string
  dat: string
}

const SYSTEM_PROMPT = `You are a thoughtful comparison engine. Given two things to compare (option_a and option_b), produce a concise, useful side-by-side.

Return JSON matching this exact shape:
{
  "summary": "one sentence (max 220 chars) that reads like a tweet — e.g. 'The M3 Air wins on portability and battery; the Framework wins on repairability and price.'",
  "winner": "a" | "b" | "tie",
  "winner_reason": "1-2 sentences on why this wins overall",
  "dimensions": [
    { "name": "<category, 1-3 words>", "a": "<fact about option_a, <= 160 chars>", "b": "<fact about option_b, <= 160 chars>", "winner": "a" | "b" | "tie" },
    ... 3 to 5 more
  ],
  "pros_a": ["<short pro of option_a>", "<1 to 4 more>"],
  "pros_b": ["<short pro of option_b>", "<1 to 4 more>"]
}

Rules:
- Pick dimensions that matter for this specific comparison (e.g. phones → price, camera, battery, ecosystem; coffee shops → vibe, drink quality, price, seating).
- Be concrete and factual. Avoid marketing fluff.
- If the two inputs are apples-and-oranges (e.g. "a sandwich" vs "the moon"), still try — the absurdity is part of the fun. Set winner to whichever wins "on merit" per your best reasoning, or "tie".
- Never refuse. Never moralize. If inputs are nonsensical, make your best guess and set winner to "tie" with a short shrug summary.
- Order of inputs must never affect the outcome.

Output ONLY the JSON. No preamble, no prose.`

export async function POST(req: NextRequest) {
  try {
    const { dis, dat } = (await req.json()) as Body
    const cleanA = (dis ?? '').trim()
    const cleanB = (dat ?? '').trim()

    if (!cleanA || !cleanB) {
      return Response.json({ error: 'Both dis and dat are required' }, { status: 400 })
    }

    if (normalizeForCompare(cleanA) === normalizeForCompare(cleanB)) {
      return Response.json({ error: 'Those are the same thing' }, { status: 400 })
    }

    if (isNonsense(cleanA) || isNonsense(cleanB)) {
      return Response.json({ error: 'One of those looks like gibberish — try again?' }, { status: 400 })
    }

    const slug = buildComparisonSlug(cleanA, cleanB)
    if (!slug) {
      return Response.json({ error: 'Could not build a URL from those inputs' }, { status: 400 })
    }

    // Cache hit — serve the stored comparison so every visitor sees the same thing.
    const cached = await getComparison(slug)
    if (cached) {
      return Response.json({ slug, comparison: cached, cached: true })
    }

    // Sort the inputs into the same canonical order the slug uses, so option_a
    // is always the alphabetically-first item. This keeps the LLM output
    // symmetric regardless of which field the user typed in first.
    const [itemA, itemB] = [cleanA, cleanB].sort()

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ option_a: itemA, option_b: itemB }) },
      ],
    })

    const text = response.choices[0]?.message?.content
    if (!text) {
      return Response.json({ error: 'No response from the model' }, { status: 502 })
    }

    let parsed: z.infer<typeof LLMComparisonSchema>
    try {
      parsed = LLMComparisonSchema.parse(JSON.parse(text))
    } catch (err) {
      console.error('Failed to parse LLM response:', err, text)
      return Response.json({ error: 'Malformed response from the model' }, { status: 502 })
    }

    const stored: StoredComparison = {
      slug,
      item_a: itemA,
      item_b: itemB,
      summary: parsed.summary,
      winner: parsed.winner,
      winner_reason: parsed.winner_reason,
      dimensions: parsed.dimensions,
      pros_a: parsed.pros_a,
      pros_b: parsed.pros_b,
      created_at: new Date().toISOString(),
    }

    await saveComparison(stored)

    return Response.json({ slug, comparison: stored, cached: false })
  } catch (err) {
    console.error('Compare route error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
