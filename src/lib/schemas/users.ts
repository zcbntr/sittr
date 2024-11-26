import { z } from "zod";

export const userSchema = z.object({
  userId: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
