"use server";

import {
  notificationSchema,
  type Notification,
} from "~/lib/schemas/notifications";
import { db } from "../db";
import { getLoggedInUser } from "./users";

export async function getUserNotifications(): Promise<Notification[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const notificationRows = await db.query.notifications.findMany({
    with: {
      associatedTask: true,
      associatedGroup: true,
      associatedPet: true,
    },
    where: (model, { eq }) => eq(model.userId, userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  if (!notificationRows) {
    throw new Error("Failed to get user notifications");
  }

  return notificationRows.map((notificationRow) =>
    notificationSchema.parse(notificationRow),
  );
}
