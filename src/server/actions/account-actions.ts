"use server";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { notificationPreferences, users } from "../db/schema";
import { authenticatedProcedure } from "./zsa-procedures";
import { updateNotificationPreferencesSchema } from "~/lib/schemas/users";

export async function upgradeUserToPlus(userId: string): Promise<void> {
  const updatedUser = await db
    .update(users)
    .set({ plan: "Plus" })
    .where(eq(users.id, userId))
    .returning()
    .execute();

  if (!updatedUser) {
    throw new Error("User not found");
  }
}

export async function upgradeUserToPro(userId: string): Promise<void> {
  const updatedUser = await db
    .update(users)
    .set({ plan: "Pro" })
    .where(eq(users.id, userId))
    .returning()
    .execute();

  if (!updatedUser) {
    throw new Error("User not found");
  }
}

export const deleteAccount = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    const userId = ctx.user.id;

    try {
      // Cascades should ensure all related data is deleted or nulled
      // Images are not immediately deleted, but have owner set to null
      // Null images are deleted later by a cron job
      await db.delete(users).where(eq(users.id, userId)).execute();
    } catch (e) {
      console.error(e);
      throw new Error("Account deletion failed - please contact support");
    }
  });

export const updateNotificationPreferences = authenticatedProcedure
  .createServerAction()
  .input(updateNotificationPreferencesSchema)
  .handler(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    const updatedPreferences = await db
      .update(notificationPreferences)
      .set({ ...input })
      .where(eq(notificationPreferences.userId, userId))
      .returning()
      .execute();

    if (!updatedPreferences?.[0]) {
      throw new Error("Failed to update users notification preferences");
    }

    return updatedPreferences[0];
  });
