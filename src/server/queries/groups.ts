"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, inArray } from "drizzle-orm";
import { groups, petImages, pets, petsToGroups } from "../db/schema";
import {
  type Group,
  type GroupMember,
  groupMemberSchema,
  type GroupPet,
  groupPetSchema,
  groupSchema,
} from "~/lib/schemas/groups";
import { type Pet, petSchema } from "~/lib/schemas/pets";
import { createClerkClient } from "@clerk/backend";
import { userSchema } from "~/lib/schemas/users";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function getGroupById(id: string): Promise<Group | null> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const group = await db.query.groups.findFirst({
    where: (model, { eq }) => eq(model.id, id),
    with: {
      petsToGroups: {
        with: {
          pet: true,
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  return groupSchema.parse({
    groupId: group.id,
    createdBy: group.createdBy,
    name: group.name,
    description: group.description,
    pets: group.petsToGroups.map((petToGroup) => petToGroup.pet),
  });
}

export async function getGroupsByIds(ids: string[]): Promise<Group[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
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
      groupId: group.id,
      createdBy: group.createdBy,
      name: group.name,
      description: group.description,
    });
  });
}

export async function getIsUserGroupOwner(groupId: string): Promise<boolean> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
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

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
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
    .leftJoin(petImages, eq(petImages.petId, pets.id))
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
      sex: pet.pets.sex,
      image: pet.pet_images?.url,
    });
  });
}

export async function getUsersPetsNotInGroup(groupId: string): Promise<Pet[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
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
    with: {
      petImages: true,
    },
  });

  if (!petsNotInGroup) {
    throw new Error("Failed to get users pets not in group");
  }

  return petsNotInGroup.map((pet) => {
    return petSchema.parse({
      petId: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      dob: pet.dob,
      sex: pet.sex,
      image: pet.petImages?.url,
    });
  });
}

export async function getGroupsUserIsIn(): Promise<Group[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const groupMemberList = await db.query.usersToGroups.findMany({
    where: (model, { eq }) => eq(model.userId, user.userId),
    with: {
      group: {
        with: {
          usersToGroups: true,
          petsToGroups: { with: { pet: true } },
        },
      },
    },
  });

  if (!groupMemberList) {
    throw new Error("Failed to get groups user is in");
  }

  const clerkUsers = await clerkClient.users.getUserList();
  return groupMemberList.map((groupMember) => {
    const members = clerkUsers.data;

    return groupSchema.parse({
      groupId: groupMember.groupId,
      createdBy: groupMember.group.createdBy,
      name: groupMember.group.name,
      description: groupMember.group.description,
      pets: groupMember.group.petsToGroups.map((petToGroup) =>
        petSchema.parse({
          petId: petToGroup.pet.id,
          name: petToGroup.pet.name,
          ownerId: petToGroup.pet.ownerId,
          createdBy: petToGroup.pet.createdBy,
          species: petToGroup.pet.species,
          breed: petToGroup.pet.breed,
          dob: petToGroup.pet.dob,
          sex: petToGroup.pet.sex,
          image: petToGroup.pet.image,
        }),
      ),
      members: groupMember.group.usersToGroups.map((userToGroup) =>
        groupMemberSchema.parse({
          id: userToGroup.id,
          groupId: userToGroup.groupId,
          userId: userToGroup.userId,
          name: members.find((x) => x.id === userToGroup.userId)?.fullName,
          avatar: members.find((x) => x.id === userToGroup.userId)?.imageUrl,
          role: userToGroup.role,
        }),
      ),
    });
  });
}
