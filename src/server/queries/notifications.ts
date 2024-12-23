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

  return notificationRows.map((notificationRow) =>
    selectNotificationSchema.parse({
      id: notificationRow.id,
      userId: notificationRow.userId,
      notificationType: notificationRow.notificationType,
      associatedTask: notificationRow.associatedTask,
      associatedGroup: notificationRow.associatedGroup,
      associatedPet: notificationRow.associatedPet,
      message: notificationRow.message,
      read: notificationRow.read,
      createdAt: notificationRow.createdAt,
      updatedAt: notificationRow.updatedAt,
    }),
  );
}
