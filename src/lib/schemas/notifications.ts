import { notifications } from "~/server/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { type z } from "zod";

export const notificationSchema = createSelectSchema(notifications);

export type Notification = z.infer<typeof notificationSchema>;
