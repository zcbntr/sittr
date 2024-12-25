"use server";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

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
