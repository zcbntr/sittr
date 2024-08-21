import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import { sittingListings, sittingRequests } from "./schema";

export async function getOwnedListings() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userListings = await db.query.sittingListings.findMany({
    where: (model, { eq }) => eq(model.ownerId, user.userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  return userListings;
}

export async function createListing(
  category: "house" | "pet" | "baby" | "plant",
) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const newListing = await db
    .insert(sittingListings)
    .values({
      ownerId: user.userId,
      category: category,
    })
    .execute();

  return newListing;
}

export async function createSittingRequest(
  sittingListingId: number,
  startDate: Date,
  endDate: Date,
) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Add check that user owns the sitting listing?
  const newSittingRequest = await db
    .insert(sittingRequests)
    .values({
      sittingListingId: sittingListingId,
      startDate: startDate.toDateString(),
      endDate: endDate.toDateString(),
    })
    .execute();

  return newSittingRequest;
}

export async function getOwnerUpcommingSittingEvents() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const ownedSittings = db
    .select()
    .from(sittingListings)
    .where(eq(sittingListings.ownerId, user.userId))
    .as("owned_sittings");
  const upcommingSittingEventsAsOwner = await db
    .select()
    .from(ownedSittings)
    .where(eq(ownedSittings.fulfilled, false));

  return upcommingSittingEventsAsOwner;
}

export async function getSitterUpcommingSittingEvents() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const sitterSittings = await db.query.sittingEvents.findMany({
    where: (model, { eq }) => eq(model.sitterId, user.userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  return sitterSittings;
}

export async function getUserOwnerPreferences() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userOwnerPreferences = await db.query.userOwnerPreferances.findFirst({
    where: (model, { eq }) => eq(model.userId, user.userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  return userOwnerPreferences;
}

export async function getUserSittingPreferences() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userSittingPreferences =
    await db.query.userSittingPreferances.findFirst({
      where: (model, { eq }) => eq(model.userId, user.userId),
      orderBy: (model, { desc }) => desc(model.createdAt),
    });

  return userSittingPreferences;
}

export async function getOwnerRecentlyFulfilledSittings() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const ownedSittingListings = db
    .select()
    .from(sittingListings)
    .where(eq(sittingListings.ownerId, user.userId))
    .as("owned_sitting_listings");
  const recentlyFulfilledSittingsAsOwner = await db
    .select()
    .from(ownedSittingListings)
    .where(eq(ownedSittingListings.fulfilled, true))
    .orderBy(desc(ownedSittingListings.updatedAt))
    .limit(5)
    .execute();

  return recentlyFulfilledSittingsAsOwner;
}
