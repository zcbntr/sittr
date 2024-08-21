import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";

export async function getUserOwnedListings() {
    const user = auth();
  
    if (!user.userId) {
      throw new Error("Unauthorized");
    }

    // Get app ids for the user's organisation
    const userListings = await db.query.sittingListings.findMany({
      where: (model, { eq }) => eq(model.ownerId, user.userId),
      orderBy: (model, { desc }) => desc(model.createdAt),
    });
  
    return userListings;
  }