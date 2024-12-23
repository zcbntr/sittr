import { type z } from "zod";
import { users } from "~/server/db/schema";
import { createSelectSchema } from "drizzle-zod";

export const selectUserSchema = createSelectSchema(users);

export type SelectUser = z.infer<typeof selectUserSchema>;

export const updateUserSchema = createSelectSchema(users).optional();

export type EditUser = z.infer<typeof updateUserSchema>;
