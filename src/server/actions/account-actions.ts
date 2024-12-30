"use server";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { authenticatedProcedure } from "./zsa-procedures";
import { signOut } from "~/auth";
import { redirect } from "next/navigation";

export async function upgradeUserToPlus(userId: string): Promise<void> {
  const updatedUser = await db
    .update(users)
    .set({ plusMembership: true })
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
