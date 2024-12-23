import { notifications } from "~/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { type z } from "zod";

export const selectNotificationSchema = createSelectSchema(notifications);

export type SelectNotification = z.infer<typeof selectNotificationSchema>;
