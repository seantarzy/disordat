import { NextRequest } from "next/server";
import OpenAI from "openai";
import { VerdictSchema } from "@/lib/schema";
import { fnv1a32, createComparisonHash } from "@/lib/hash";
import { normalizeForCompare, isNonsense } from "@/lib/normalize";
import { buildHistoryAwarePrompt } from "@/lib/judgePrompt";

export const runtime = "edge";

type Body = {
  dis: string;
  dat: string;
  history?: Array<{
    dis: string;
    dat: string;
    verdict: "dis" | "dat" | "shrug";
    reasoning: string;
  }>;
};

export async function POST(req: NextRequest) {
  try {
    const { dis, dat, history = [] } = (await req.json()) as Body;
    const rawDis = dis ?? "";
    const rawDat = dat ?? "";
    const nd = normalizeForCompare(rawDis);
    const nt = normalizeForCompare(rawDat);

    // Early shrug if empty/identical
    if ((!nd && !nt) || nd === nt) {
      return Response.json({
        verdict: "shrug",
        reasoning: "Inputs are empty/identical."
      });
    }

    const nonsenseDis = isNonsense(rawDis);
    const nonsenseDat = isNonsense(rawDat);

    // If one is nonsense and the other is not, prefer the non-nonsense side directly
    if (nonsenseDis && !nonsenseDat) {
      return Response.json({
        verdict: "dat",
        reasoning: "'Dis' looks like nonsense; picking 'dat'."
      });
    }
    if (!nonsenseDis && nonsenseDat) {
      return Response.json({
        verdict: "dis",
        reasoning: "'Dat' looks like nonsense; picking 'dis'."
      });
    }

    // Sort inputs alphabetically for unbiased AI comparison
    const [optionA, optionB] = [rawDis, rawDat].sort();
    const isDisFirst = rawDis <= rawDat; // Check if dis was first in alphabetical order

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build history-aware prompt
    const systemPrompt = buildHistoryAwarePrompt(history);

    // Build OpenAI API call with JSON schema
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            option_a: optionA,
            option_b: optionB,
            context:
              "Compare based on merit, achievements, and substance. Pick option_a (0) or option_b (1) unless inputs are nonsense/unsafe."
          })
        }
      ]
    });

    // Extract JSON text
    const textChunk = response.choices[0]?.message?.content;

    let parsed = null as null | {
      choice: 0 | 1 | -1;
      reasoning: string;
    };
    if (textChunk) {
      try {
        parsed = VerdictSchema.parse(JSON.parse(textChunk));
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.error("Raw response:", textChunk);

        // Try to extract choice from text if JSON parsing fails
        const lowerText = textChunk.toLowerCase();
        if (
          lowerText.includes('"choice": 0') ||
          lowerText.includes('choice": 0')
        ) {
          parsed = {
            choice: 0,
            reasoning: "Extracted from malformed response"
          };
        } else if (
          lowerText.includes('"choice": 1') ||
          lowerText.includes('choice": 1')
        ) {
          parsed = {
            choice: 1,
            reasoning: "Extracted from malformed response"
          };
        } else if (
          lowerText.includes('"choice": -1') ||
          lowerText.includes('choice": -1')
        ) {
          parsed = {
            choice: -1,
            reasoning: "Extracted from malformed response"
          };
        }
      }
    }

    if (!parsed) {
      // Fallback: shrug if we can't parse the response
      return Response.json({
        verdict: "shrug",
        reasoning: "Unable to parse response; shrugging."
      });
    }

    // Map AI choice back to dis/dat format
    if (parsed.choice === -1) {
      return Response.json({
        verdict: "shrug",
        reasoning: parsed.reasoning
      });
    }

    // Determine which option the AI chose and map back to dis/dat
    const aiChoseFirst = parsed.choice === 0;
    const verdict = aiChoseFirst === isDisFirst ? "dis" : "dat";

    return Response.json({
      verdict,
      reasoning: parsed.reasoning
    });
  } catch (e) {
    // On any server error, default to deterministic decision
    return Response.json(
      { verdict: "dis", reasoning: "Server error; defaulted to 'dis'." },
      { status: 200 }
    );
  }
}
