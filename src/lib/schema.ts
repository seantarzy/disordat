import { z } from "zod";
export const VerdictSchema = z.object({
  choice: z.number().refine((val) => val === 0 || val === 1 || val === -1, {
    message: "Choice must be 0, 1, or -1"
  }),
  reasoning: z.string().min(1)
});
export type Verdict = z.infer<typeof VerdictSchema>;

