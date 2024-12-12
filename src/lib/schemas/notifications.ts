import { notifications } from "~/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { type z } from "zod";
import { groupSchema } from "./groups";
import { petSchema } from "./pets";
import { taskSchema } from "./tasks";

export const notificationSchema = createSelectSchema(notifications, {
  associatedGroup: groupSchema.optional(),
  associatedPet: petSchema.optional(),
  associatedTask: taskSchema.optional(),
});

export type Notification = z.infer<typeof notificationSchema>;
