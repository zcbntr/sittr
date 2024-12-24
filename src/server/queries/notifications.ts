"use server";

import {
  selectNotificationSchema,
  type SelectNotification,
} from "~/lib/schemas/notifications";
import { db } from "../db";
import { getLoggedInUser } from "./users";

export async function getUserNotifications(): Promise<SelectNotification[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const notificationRows = await db.query.notifications.findMany({
    where: (model, { eq }) => eq(model.userId, userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  if (!notificationRows) {
    throw new Error("Failed to get user notifications");
  }

  return notificationRows.map((notification) =>
    selectNotificationSchema.parse({ ...notification }),
  );
}
