import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import { sittingEvents, sittingRequests, userPreferances } from "./db/schema";
import { type SittingTypeEnum } from "~/lib/schema";

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
  name: string,
  category: SittingTypeEnum,
  startDate: Date,
  endDate: Date,
) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const newSittingRequest = await db
    .insert(sittingRequests)
    .values({
      name: name,
      ownerId: user.userId,
      category: category,
      startDate: startDate,
      endDate: endDate,
    })
    .execute();

  return newSittingRequest;
}

export async function getSittingRequestsStartingInRange(from: Date, to: Date) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const upcomingSittingRequests = await db.query.sittingRequests.findMany({
    where: (model, { eq, gte, lte, and }) =>
      and(
        eq(model.ownerId, user.userId),
        gte(model.startDate, from),
        lte(model.startDate, to),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  return upcomingSittingRequests;
}

// Untested - might explode
export async function getOwnerUpcommingSittings() {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const upcommingSittingEventsAsOwner = await db
    .select()
    .from(sittingEvents)
    .innerJoin(
      sittingRequests,
      eq(sittingRequests.id, sittingEvents.sittingRequest),
    )
    .where(eq(sittingRequests.ownerId, user.userId))
    .orderBy(desc(sittingRequests.createdAt))
    .execute();

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
