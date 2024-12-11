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
import { auth } from "~/auth";
import { getUserByEmail } from "./users";
import { userSchema } from "~/lib/schemas/users";

export async function getGroupById(id: string): Promise<Group | null> {
  const userId = (await auth())?.user?.id;

  if (!userId) {
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
    pets: group.petsToGroups.map((petToGroup) =>
      petSchema.parse({
        petId: petToGroup.pet.id,
        ownerId: petToGroup.pet.ownerId,
        createdBy: petToGroup.pet.createdBy,
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
  const userId = (await auth())?.user?.id;

  if (!userId) {
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
  const userId = (await auth())?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

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
  const userId = (await auth())?.user?.id;

  if (!userId) {
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
  const userId = (await auth())?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const groupPets = await db.query.groups.findFirst({
    where: (model, { eq }) => eq(model.id, groupId),
    with: { petsToGroups: { with: { pet: { with: { petImages: true } } } } },
  });

  if (!groupPets) {
    throw new Error("Failed to get group pets");
  }

  return groupPets.petsToGroups.map((groupPet) => {
    return petSchema.parse(groupPet.pet);
  });
}

export async function getUsersPetsNotInGroup(groupId: string): Promise<Pet[]> {
  const userId = (await auth())?.user?.id;

  if (!userId) {
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
        eq(model.ownerId, userId),
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
      createdBy: pet.createdBy,
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
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await getUserByEmail(session?.user?.email);

  const userId = user.id;

  const groupMemberList = await db.query.usersToGroups.findMany({
    where: (model, { eq }) => eq(model.userId, userId),
    with: {
      group: {
        with: {
          usersToGroups: { with: { user: true } },
          petsToGroups: { with: { pet: { with: { petImages: true } } } },
        },
      },
    },
  });

  if (!groupMemberList) {
    throw new Error("Failed to get groups user is in");
  }

  // Could a query work here?
  return groupMemberList.map((groupMember) => {
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
