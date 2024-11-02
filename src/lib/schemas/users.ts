import { z } from "zod";

export const user = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
});

export type User = z.infer<typeof user>;
