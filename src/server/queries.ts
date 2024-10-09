"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, desc, and } from "drizzle-orm";
import {
  groupInviteCodes,
  groupMembers,
  groups,
  houses,
  pets,
  plants,
  sittingEvents,
  sittingRequests,
  sittingSubjects,
  tasks,
  userPreferances,
} from "./db/schema";
import {
  House,
  houseSchema,
  Pet,
  petSchema,
  Plant,
  plantSchema,
  SittingSubject,
  type SittingTypeEnum,
} from "~/lib/schema";
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

export async function createGroup(
  name: string,
  sittingSubjects: number[],
  description?: string,
) {
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
        description: description,
        sittingSubjects: sittingSubjects,
      })
      .returning();

    if (!newGroup) {
      db.rollback();
      throw new Error("Failed to create group");
    }

    // Add user to groupMembers table
    const groupMember = await db.insert(groupMembers).values({
      groupId: newGroup[0].id,
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

  if (!inviteCodeRow?.valid) {
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

export async function leaveGroup(groupId: number) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const groupMember = await db.query.groupMembers.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.groupId, groupId), eq(model.userId, user.userId)),
  });

  if (!groupMember) {
    throw new Error("User is not in the group");
  }

  const deletedGroupMember = await db
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, user.userId),
        eq(groupMembers.groupId, groupId),
      ),
    )
    .returning();

  return deletedGroupMember;
}

export async function getGroupMembers(groupId: number) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const groupMembersList = await db.query.groupMembers.findMany({
    where: (model, { eq }) => eq(model.groupId, groupId),
  });

  return groupMembersList;
}

export async function deleteGroup(groupId: number) {
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

  if (!groupMember) {
    throw new Error("User is not the owner of the group");
  }

  const deletedGroup = await db
    .delete(groups)
    .where(eq(groups.id, groupId))
    .returning();

  return deletedGroup;
}

export async function createTask(
  name: string,
  startDate?: Date,
  endDate?: Date,
  dueDate?: Date,
  description?: string,
) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const newTask = await db
    .insert(tasks)
    .values({
      name: name,
      ownerId: user.userId,
      startDate: startDate,
      endDate: endDate,
      dueDate: dueDate,
      description: description,
    })
    .execute();

  return newTask;
}

export async function createPet(
  name: string,
  species: string,
  birthdate: Date,
  breed?: string,
) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  await db.transaction(async (db) => {
    const newPet = await db
      .insert(pets)
      .values({
        name: name,
        species: species,
        breed: breed,
        dob: birthdate,
      })
      .returning();

    if (!newPet) {
      db.rollback();
      throw new Error("Failed to create pet in pet table");
    }

    const newSittingSubject = await db.insert(sittingSubjects).values({
      ownerId: user.userId,
      entityId: newPet[0].id,
      entityType: "Pet",
    });

    if (!newSittingSubject) {
      db.rollback();
      throw new Error("Failed to create pet link in sittingSubjects table");
    }

    return newPet;
  });

  throw new Error("Failed to create pet");
}

export async function getOwnedPets(): Promise<Pet[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Join sittingSubjects with pets
  const subjectsList = db
    .select({
      subjectId: sittingSubjects.id,
      entityType: sittingSubjects.entityType,
      entityId: sittingSubjects.entityId,
    })
    .from(sittingSubjects)
    .where(
      and(
        eq(sittingSubjects.ownerId, user.userId),
        eq(sittingSubjects.entityType, "Pet"),
      ),
    )
    .as("owned_pet_subjects");

  const joinedPets = await db
    .select()
    .from(subjectsList)
    .innerJoin(pets, eq(subjectsList.entityId, pets.id))
    .execute();

  // Turn into zod pet type
  const petsList: Pet[] = joinedPets.map((petSubject) => {
    return petSchema.parse({
      id: petSubject.pets.id,
      subjectId: petSubject.owned_pet_subjects.subjectId,
      name: petSubject.pets.name,
      species: petSubject.pets.species,
      breed: petSubject.pets.breed,
      dob: petSubject.pets.dob,
    });
  });

  return petsList;
}

export async function getOwnedHouses(): Promise<House[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Join sittingSubjects with houses
  const subjectsList = db
    .select({
      subjectId: sittingSubjects.id,
      entityType: sittingSubjects.entityType,
      entityId: sittingSubjects.entityId,
    })
    .from(sittingSubjects)
    .where(
      and(
        eq(sittingSubjects.ownerId, user.userId),
        eq(sittingSubjects.entityType, "House"),
      ),
    )
    .as("owned_house_subjects");

  const joinedHouses = await db
    .select()
    .from(subjectsList)
    .innerJoin(houses, eq(subjectsList.entityId, houses.id))
    .execute();

  // Turn into zod house type
  const housesList: House[] = joinedHouses.map((houseSubject) => {
    return houseSchema.parse({
      id: houseSubject.houses.id,
      subjectId: houseSubject.owned_house_subjects.subjectId,
      name: houseSubject.houses.name,
      address: houseSubject.houses.address,
    });
  });

  return housesList;
}

export async function getOwnedPlants(): Promise<Plant[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Join sittingSubjects with plants
  const subjectsList = db
    .select({
      subjectId: sittingSubjects.id,
      entityType: sittingSubjects.entityType,
      entityId: sittingSubjects.entityId,
    })
    .from(sittingSubjects)
    .where(
      and(
        eq(sittingSubjects.ownerId, user.userId),
        eq(sittingSubjects.entityType, "Plant"),
      ),
    )
    .as("owned_plant_subjects");

  const joinedPlants = await db
    .select()
    .from(subjectsList)
    .innerJoin(plants, eq(subjectsList.entityId, plants.id))
    .execute();

  // Turn into zod plant type
  const plantsList: Plant[] = joinedPlants.map((plantSubject) => {
    return plantSchema.parse({
      id: plantSubject.plants.id,
      subjectId: plantSubject.owned_plant_subjects.subjectId,
      name: plantSubject.plants.name,
      species: plantSubject.plants.species,
      lastWatered: plantSubject.plants.lastWatered,
    });
  });

  return plantsList;
}

// Make this a return a defined type with zod so the frontend can be made nicer
export async function getOwnedSubjects(): Promise<SittingSubject[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Get pets, houses, and plants
  const petsList = await getOwnedPets();
  const housesList = await getOwnedHouses();
  const plantsList = await getOwnedPlants();

  // Combine all subjects
  const allSubjects = [...petsList, ...housesList, ...plantsList];

  return allSubjects;
}
