import { z } from "zod";
import { notificationPreferences, users } from "~/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import {
  type SelectGroupInput,
  type SelectGroupOutput,
  selectGroupSchema,
} from "./groups";
import {
  type SelectPetInput,
  type SelectPetOutput,
  selectPetSchema,
} from "./pets";

export const selectBasicUserSchema = createSelectSchema(users);

export type SelectBasicUser = z.infer<typeof selectBasicUserSchema>;

export type SelectUserInput = z.input<typeof selectBasicUserSchema> & {
  notificationPreferences?: SelectNotificationPreferences;
  petsOwned?: SelectPetInput[];
  groupsOwned?: SelectGroupInput[];
};

export type SelectUserOutput = z.input<typeof selectBasicUserSchema> & {
  notificationPreferences?: SelectNotificationPreferences;
  petsOwned?: SelectPetOutput[];
  groupsOwned?: SelectGroupOutput[];
};

export const selectUserSchema: z.ZodType<
  SelectUserInput,
  z.ZodTypeDef,
  SelectUserOutput
> = selectBasicUserSchema.extend({
  notificationPreferences: z.lazy(() =>
    selectNotificationPreferencesSchema.optional(),
  ),
  petsOwned: z.lazy(() => selectPetSchema.array().optional()),
  groupsOwned: z.lazy(() => selectGroupSchema.array().optional()),
});

export type SelectUser = z.infer<typeof selectUserSchema>;

export const updateUserSchema = createSelectSchema(users).partial();

export type EditUser = z.infer<typeof updateUserSchema>;

export const selectNotificationPreferencesSchema = createSelectSchema(
  notificationPreferences,
);

export type SelectNotificationPreferences = z.infer<
  typeof selectNotificationPreferencesSchema
>;

export const updateNotificationPreferencesSchema = createSelectSchema(
  notificationPreferences,
).omit({
  createdAt: true,
  updatedAt: true,
});

export type EditNotificationPreferences = z.infer<
  typeof updateNotificationPreferencesSchema
>;
