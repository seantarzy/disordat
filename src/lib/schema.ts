import { z } from "zod";
export const VerdictSchema = z.object({
  verdict: z.enum(["dis", "dat", "shrug"]),
  reasoning: z.string().min(1),
});
export type Verdict = z.infer<typeof VerdictSchema>;

