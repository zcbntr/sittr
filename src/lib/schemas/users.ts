import { z } from "zod";
import { users } from "~/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { type SelectGroupInput, selectGroupSchema } from "./groups";

export const selectBasicUserSchema = createSelectSchema(users);

export type SelectBasicUser = z.infer<typeof selectBasicUserSchema>;

export type SelectUserInput = z.input<typeof selectBasicUserSchema> & {
  pets?: SelectGroupInput[];
  groups?: SelectGroupInput[];
};

export type SelectUserOutput = z.input<typeof selectBasicUserSchema> & {
  pets?: SelectGroupInput[];
  groups?: SelectGroupInput[];
};

export const selectUserSchema: z.ZodType<
  SelectUserInput,
  z.ZodTypeDef,
  SelectUserOutput
> = selectBasicUserSchema.extend({
  pets: z.lazy(() => selectGroupSchema.array().optional()),
  groups: z.lazy(() => selectGroupSchema.array().optional()),
});

export type SelectUser = z.infer<typeof selectUserSchema>;

export const updateUserSchema = createSelectSchema(users).partial();

export type EditUser = z.infer<typeof updateUserSchema>;
