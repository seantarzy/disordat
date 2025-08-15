import { NextRequest } from "next/server";
import OpenAI from "openai";
import { VerdictSchema } from "@/lib/schema";
import { fnv1a32 } from "@/lib/hash";
import { normalizeForCompare, isNonsense } from "@/lib/normalize";
import { SYSTEM_PROMPT } from "@/lib/judgePrompt";

export const runtime = "edge";

type Body = { dis: string; dat: string };

export async function POST(req: NextRequest) {
  try {
    const { dis, dat } = (await req.json()) as Body;
    const rawDis = dis ?? "";
    const rawDat = dat ?? "";
    const nd = normalizeForCompare(rawDis);
    const nt = normalizeForCompare(rawDat);

    // Early shrug if empty/identical
    if (!nd && !nt || nd === nt) {
      return Response.json({ verdict: "shrug", reasoning: "Inputs are empty/identical." });
    }

    const nonsenseDis = isNonsense(rawDis);
    const nonsenseDat = isNonsense(rawDat);

    // If one is nonsense and the other is not, prefer the non-nonsense side directly
    if (nonsenseDis && !nonsenseDat) {
      return Response.json({ verdict: "dat", reasoning: "'Dis' looks like nonsense; picking 'dat'." });
    }
    if (!nonsenseDis && nonsenseDat) {
      return Response.json({ verdict: "dis", reasoning: "'Dat' looks like nonsense; picking 'dis'." });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build OpenAI API call with JSON schema
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            dis: rawDis,
            dat: rawDat,
            context: "Compare based on merit, achievements, and substance. Pick dis or dat unless inputs are nonsense/unsafe."
          })
        }
      ]
    });

    // Extract JSON text
    const textChunk = response.choices[0]?.message?.content;

    let parsed = null as null | { verdict: "dis"|"dat"|"shrug"; reasoning: string };
    if (textChunk) {
      try {
        parsed = VerdictSchema.parse(JSON.parse(textChunk));
      } catch {}
    }

    if (!parsed) {
      // Fallback: shrug if we can't parse the response
      parsed = { verdict: "shrug", reasoning: "Unable to parse response; shrugging." };
    }

    // Respect the model's decision, including shrugs for true ties

    return Response.json(parsed);
  } catch (e) {
    // On any server error, default to deterministic decision
    return Response.json({ verdict: "dis", reasoning: "Server error; defaulted to 'dis'." }, { status: 200 });
  }
}
