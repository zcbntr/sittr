import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import {
  groupInviteCodes,
  groupMembers,
  groups,
  sittingEvents,
  sittingRequests,
  userPreferances,
} from "./db/schema";
import { type SittingTypeEnum } from "~/lib/schema";
import { sha256 } from "crypto-hash";

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

export async function updateSittingRequest(
  id: number,
  name: string,
  category: SittingTypeEnum,
  startDate: Date,
  endDate: Date,
) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const updatedSittingRequest = await db
    .update(sittingRequests)
    .set({
      name: name,
      category: category,
      startDate: startDate,
      endDate: endDate,
    })
    .where(eq(sittingRequests.id, id))
    .execute();

  return updatedSittingRequest;
}

export async function deleteSittingRequest(id: number) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const deletedSittingRequest = await db
    .delete(sittingRequests)
    .where(eq(sittingRequests.id, id))
    .execute();

  return deletedSittingRequest;
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

export async function createGroup(name: string) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  let newGroup;

  // Create group and add user to groupMembers table in a transaction
  await db.transaction(async (db) => {
    // Create group
    newGroup = await db
      .insert(groups)
      .values({
        name: name,
      })
      .returning();

    if (!newGroup) {
      db.rollback();
      throw new Error("Failed to create group");
    }

    // Add user to groupMembers table
    const groupMember = await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: user.userId,
      role: "Owner",
    });

    if (!groupMember) {
      db.rollback();
      throw new Error("Failed to add user to group");
    }
  });

  return newGroup;
}

export async function getNewGroupInviteCode(
  groupId: number,
  maxUses: number,
  expiresAt: Date,
  requiresApproval: boolean,
) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Check user is the owner of the group
  const groupMember = await db.query.groupMembers.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (groupMember) {
    throw new Error(
      "User is not the owner of the group, not a member, or the group doesn't exist",
    );
  }

  // Create a new invite code based on the group id and random number
  function getRandomUint32() {
    const data = new Uint32Array(1);
    crypto.getRandomValues(data);
    return data[0];
  }

  const inviteCode = getRandomUint32()?.toString(16);

  if (!inviteCode) {
    throw new Error("Failed to generate invite code");
  }

  const newInviteCode = await db
    .insert(groupInviteCodes)
    .values({
      groupId: groupId,
      code: inviteCode,
      maxUses: maxUses,
      expiresAt: expiresAt,
      requiresApproval: requiresApproval,
    })
    .execute();

  return newInviteCode;
}

export async function joinGroup(inviteCode: string) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // This needs to be a find many if there becomes lots of groups
  const inviteCodeRow = await db.query.groupInviteCodes.findFirst({
    where: (model, { eq }) => eq(model.code, inviteCode),
  });

  if (!inviteCodeRow || !inviteCodeRow.valid) {
    throw new Error("Invalid invite code");
  }

  // Check if the invite code has expired
  if (inviteCodeRow.expiresAt < new Date()) {
    // Set code to invalid
    await db
      .update(groupInviteCodes)
      .set({ valid: false })
      .where(eq(groupInviteCodes.id, inviteCodeRow.id))
      .execute();

    throw new Error("Invite code has expired");
  }

  // Check if the invite code has reached its max uses
  if (inviteCodeRow.uses >= inviteCodeRow.maxUses) {
    // Set code to invalid
    await db
      .update(groupInviteCodes)
      .set({ valid: false })
      .where(eq(groupInviteCodes.id, inviteCodeRow.id))
      .execute();

    throw new Error("Invite code has reached its max uses");
  }

  // Check if the user is already in the group
  const existingGroupRow = await db.query.groupMembers.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, inviteCodeRow.groupId),
        eq(model.userId, user.userId),
      ),
  });

  if (existingGroupRow) {
    throw new Error("User is already in the group");
  }

  // Add the user to the group
  const newGroupMember = await db
    .insert(groupMembers)
    .values({
      groupId: inviteCodeRow.groupId,
      userId: user.userId,
      role: inviteCodeRow.requiresApproval ? "PendingApproval" : "Member",
    })
    .execute();

  // Increment the invite code uses
  await db
    .update(groupInviteCodes)
    .set({ uses: inviteCodeRow.uses + 1 })
    .where(eq(groupInviteCodes.id, inviteCodeRow.id))
    .execute();

  return newGroupMember;
}
