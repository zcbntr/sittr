"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, inArray } from "drizzle-orm";
import { groups, pets, petsToGroups } from "../db/schema";
import {
  type Group,
  type GroupMember,
  type GroupPet,
  groupPetSchema,
  groupSchema,
} from "~/lib/schemas/groups";
import { type Pet, petSchema } from "~/lib/schemas/pets";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function getGroupById(id: string): Promise<Group | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const group = await db.query.groups.findFirst({
    where: (model, { eq }) => eq(model.id, id),
  });

  if (!group) {
    return "Group not found";
  }

  return groupSchema.parse({
    id: group.id,
    name: group.name,
    description: group.description,
  });
}

export async function getGroupsByIds(ids: string[]): Promise<Group[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const groupsList = await db
    .select()
    .from(groups)
    .where(inArray(groups.id, ids));

  if (!groupsList) {
    throw new Error("Failed to get groups by ids");
  }

  return groupsList.map((group) => {
    return groupSchema.parse({
      id: group.id,
      name: group.name,
      description: group.description,
    });
  });
}

export async function getIsUserGroupOwner(
  groupId: string,
): Promise<boolean | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  return !!groupMember;
}

export async function getGroupMembers(
  groupId: string,
): Promise<GroupMember[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const userToGroupRows = await db.query.usersToGroups.findMany({
    where: (model, { eq }) => eq(model.groupId, groupId),
  });

  const loggedInUserId = userToGroupRows.map((row) => row.userId)[0];

  if (!loggedInUserId) {
    throw new Error("Failed to get userId");
  }

  const clerkUsers = await clerkClient.users.getUserList();

  if (!clerkUsers) {
    throw new Error("Failed to get users from Clerk");
  }

  return userToGroupRows.map((row) => {
    const user = clerkUsers.data.find((user) => user.id === row.userId);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: row.id,
      groupId: row.groupId,
      userId: user.id,
      name: user.firstName ? user.firstName + " " + user.lastName : "Unknown",
      avatar: user.imageUrl,
      role: row.role,
    };
  });
}

export async function getGroupPets(groupId: string): Promise<GroupPet[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const groupPetsList = await db
    .select()
    .from(pets)
    .leftJoin(petsToGroups, eq(petsToGroups.petId, pets.id))
    .where(eq(petsToGroups.groupId, groupId));

  if (!groupPetsList) {
    throw new Error("Failed to get pets of group");
  }

  return groupPetsList.map((pet) => {
    if (pet.pets_to_groups === null) {
      throw new Error("Failed to get pets of group");
    }

    return groupPetSchema.parse({
      id: pet.pets_to_groups.id,
      petId: pet.pets.id,
      groupId: pet.pets_to_groups.groupId,
      ownerId: pet.pets.ownerId,
      name: pet.pets.name,
      species: pet.pets.species,
      breed: pet.pets.breed,
      dob: pet.pets.dob,
    });
  });
}

export async function getUsersPetsNotInGroup(
  groupId: string,
): Promise<Pet[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const petsNotInGroup = await db.query.pets.findMany({
    where: (model, { and, not, inArray }) =>
      and(
        not(
          inArray(
            model.id,
            db
              .select({ petId: petsToGroups.petId })
              .from(petsToGroups)
              .where(eq(petsToGroups.groupId, groupId)),
          ),
        ),
        eq(model.ownerId, user.userId),
      ),
  });

  if (!petsNotInGroup) {
    throw new Error("Failed to get users pets not in group");
  }

  return petsNotInGroup.map((pet) => {
    return petSchema.parse({
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      dob: pet.dob,
    });
  });
}

export async function getGroupsUserIsIn(): Promise<Group[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const groupMemberList = await db.query.usersToGroups.findMany({
    where: (model, { eq }) => eq(model.userId, user.userId),
    with: {
      group: {
        with: {
          usersToGroups: true,
        },
      },
    },
  });

  if (!groupMemberList) {
    throw new Error("Failed to get groups user is in");
  }

  return groupMemberList.map((groupMember) => {
    return groupSchema.parse({
      id: groupMember.groupId,
      name: groupMember.group.name,
      description: groupMember.group.description,
    });
  });
}
