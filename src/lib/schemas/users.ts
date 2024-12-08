import { z } from "zod";
import { users } from "~/server/db/schema";
import { createSelectSchema } from "drizzle-zod";

export const selectUserSchema = createSelectSchema(users);

export type User = z.infer<typeof selectUserSchema>;
