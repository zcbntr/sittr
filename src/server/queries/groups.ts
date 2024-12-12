"use server";

import { db } from "~/server/db";
import { eq, inArray } from "drizzle-orm";
import { groups, petsToGroups } from "../db/schema";
import {
  type Group,
  type GroupMember,
  groupMemberSchema,
  groupSchema,
} from "~/lib/schemas/groups";
import { type Pet, petSchema } from "~/lib/schemas/pets";
import { getLoggedInUser } from "./users";
import { userSchema } from "~/lib/schemas/users";

export async function getGroupById(id: string): Promise<Group | null> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const group = await db.query.groups.findFirst({
    where: (model, { eq }) => eq(model.id, id),
    with: {
      creator: true,
      usersToGroups: {
        with: {
          user: true,
        },
        // User must be in the group to view it
        where: (model, { eq }) => eq(model.userId, user.id),
      },
      petsToGroups: {
        with: {
          pet: { with: { creator: true, owner: true } },
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  return groupSchema.parse({
    id: group.id,
    createdBy: group.creator,
    name: group.name,
    description: group.description,
    pets: group.petsToGroups.map((petToGroup) =>
      petSchema.parse({
        petId: petToGroup.pet.id,
        owner: petToGroup.pet.owner,
        creator: petToGroup.pet.creator,
        name: petToGroup.pet.name,
        species: petToGroup.pet.species,
        breed: petToGroup.pet.breed,
        dob: petToGroup.pet.dob,
        sex: petToGroup.pet.sex,
        image: petToGroup.pet.image,
      }),
    ),
  });
}

export async function getGroupsByIds(ids: string[]): Promise<Group[]> {
  const user = await getLoggedInUser();

  if (!user) {
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
      id: group.id,
      createdBy: group.creatorId,
      name: group.name,
      description: group.description,
    });
  });
}

export async function getIsUserGroupOwner(groupId: string): Promise<boolean> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, groupId),
        eq(model.userId, userId),
        eq(model.role, "Owner"),
      ),
  });

  return !!groupMember;
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userToGroupRows = await db.query.usersToGroups.findMany({
    where: (model, { eq }) => eq(model.groupId, groupId),
    with: { user: true },
  });

  return userToGroupRows.map((row) => {
    return groupMemberSchema.parse({
      groupId: row.groupId,
      user: row.user,
      role: row.role,
    });
  });
}

export async function getGroupPets(groupId: string): Promise<Pet[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const groupPets = await db.query.groups.findFirst({
    where: (model, { eq }) => eq(model.id, groupId),
    with: {
      petsToGroups: {
        with: {
          pet: { with: { creator: true, owner: true, petImages: true } },
        },
      },
    },
  });

  if (!groupPets) {
    throw new Error("Failed to get group pets");
  }

  return groupPets.petsToGroups.map((groupPet) => {
    return petSchema.parse({
      id: groupPet.pet.id,
      ownerId: groupPet.pet.ownerId,
      owner: userSchema.parse(groupPet.pet.owner),
      creatorId: groupPet.pet.creatorId,
      creator: userSchema.parse(groupPet.pet.creator),
      name: groupPet.pet.name,
      species: groupPet.pet.species,
      breed: groupPet.pet.breed,
      dob: groupPet.pet.dob instanceof Date ? groupPet.pet.dob : new Date(),
      sex: groupPet.pet.sex,
      image: groupPet.pet.petImages?.url,
      note: groupPet.pet.note,
    });
  });
}

export async function getUsersPetsNotInGroup(groupId: string): Promise<Pet[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

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
        eq(model.ownerId, userId),
      ),
    with: {
      petImages: true,
      owner: true,
      creator: true,
    },
  });

  if (!petsNotInGroup) {
    throw new Error("Failed to get users pets not in group");
  }

  return petsNotInGroup.map((pet) => {
    return petSchema.parse({
      id: pet.id,
      ownerId: pet.ownerId,
      owner: pet.owner,
      creatorId: pet.creatorId,
      creator: pet.creator,
      name: pet.name,
      species: pet.species,
      breed: pet.breed ? pet.breed : undefined,
      dob: pet.dob ? pet.dob : undefined,
      sex: pet.sex ? pet.sex : undefined,
      image: pet.petImages ? pet.petImages?.url : undefined,
      note: pet.note ? pet.note : undefined,
    });
  });
}

export async function getGroupsUserIsIn(): Promise<Group[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const groupMemberList = await db.query.usersToGroups.findMany({
    where: (model, { eq }) => eq(model.userId, userId),
    with: {
      group: {
        with: {
          creator: true,
          usersToGroups: { with: { user: true } },
          petsToGroups: {
            with: {
              pet: { with: { petImages: true, owner: true, creator: true } },
            },
          },
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
      creatorId: groupMember.group.creatorId,
      creator: groupMember.group.creator,
      name: groupMember.group.name,
      description: groupMember.group.description,
      pets: groupMember.group.petsToGroups.map((petToGroup) =>
        petSchema.parse({
          id: petToGroup.pet.id,
          name: petToGroup.pet.name,
          ownerId: petToGroup.pet.ownerId,
          owner: petToGroup.pet.owner,
          creatorId: petToGroup.pet.creatorId,
          creator: petToGroup.pet.creator,
          species: petToGroup.pet.species,
          breed: petToGroup.pet.breed,
          dob: petToGroup.pet.dob,
          sex: petToGroup.pet.sex,
          image: petToGroup.pet.petImages?.url,
        }),
      ),
      members: groupMember.group.usersToGroups.map((userToGroup) =>
        groupMemberSchema.parse({
          groupId: userToGroup.groupId,
          user: userSchema.parse(userToGroup.user),
          role: userToGroup.role,
        }),
      ),
    });
  });
}
