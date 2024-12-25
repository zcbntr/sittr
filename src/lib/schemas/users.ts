import { z } from "zod";
import { users } from "~/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { selectBasicGroupSchema } from "./groups";



export const selectBasicUserSchema = createSelectSchema(users);

export type SelectBasicUser = z.infer<typeof selectBasicUserSchema>;

export const selectUserSchema = selectBasicUserSchema.merge(
    z.object({
        pets: z.array(selectBasicGroupSchema).optional(),
        groups: z.array(selectBasicGroupSchema).optional(),
    })
)

export type SelectUser = z.infer<typeof selectUserSchema>;

export const updateUserSchema = createSelectSchema(users).partial();

export type EditUser = z.infer<typeof updateUserSchema>;
