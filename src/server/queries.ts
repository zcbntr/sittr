import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import { sittingRequests, userPreferances } from "./db/schema";

export async function getOwnedSittingRequests() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userListings = await db.query.sittingRequests.findMany({
    where: (model, { eq }) => eq(model.ownerId, user.userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  return userListings;
}

export async function createSittingRequest(
  category: "house" | "pet" | "baby" | "plant",
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
      ownerId: user.userId,
      category: category,
      startDate: startDate.toDateString(),
      endDate: endDate.toDateString(),
    })
    .execute();

  return newSittingRequest;
}

export async function getSittingRequestsInRange(from: Date, to: Date) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const upcomingSittingRequests = await db.query.sittingRequests.findMany({
    where: (model, { eq, gte, lte, and }) =>
      and(
        eq(model.ownerId, user.userId),
        gte(model.startDate, from.toDateString()),
        lte(model.endDate, to.toDateString()),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  return upcomingSittingRequests;
}

export async function getOwnerUpcommingSittings() {
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

export async function userCompletedOnboarding(): Promise<boolean> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userOwnerPreferances = await getUserOwnerPreferences();
  if (userOwnerPreferances) return true;
  const userSitterPreferances = await getUserSittingPreferences();
  if (userSitterPreferances) return true;
  return false;
}

export async function getUserOwnerPreferences() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userOwnerPreferences = await db.query.userPreferances.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.isOwner, true), eq(model.userId, user.userId)),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  return userOwnerPreferences;
}

export async function getUserSittingPreferences() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userSittingPreferences = await db.query.userPreferances.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.isOwner, false), eq(model.userId, user.userId)),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  return userSittingPreferences;
}

export async function setUserPreferences(
  isOwner: boolean,
  pet: boolean,
  house: boolean,
  baby: boolean,
  plant: boolean,
) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const preferences = await db.insert(userPreferances).values({
    userId: user.userId,
    isOwner: isOwner,
    petSitting: pet,
    houseSitting: house,
    babySitting: baby,
    plantSitting: plant,
  });

  return preferences;
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
