"use server";

import { db } from "~/server/db";
import { eq, inArray } from "drizzle-orm";
import { groups, petsToGroups } from "../db/schema";
import {
  type SelectBasicGroupMember,
  selectGroupMemberSchema,
  selectGroupSchema,
  selectBasicGroupSchema,
  type SelectGroup,
} from "~/lib/schemas/groups";
import { type SelectBasicPet, selectPetSchema } from "~/lib/schemas/pets";
import { getBasicLoggedInUser } from "./users";
import { selectUserSchema } from "~/lib/schemas/users";

export async function getGroupById(id: string): Promise<SelectGroup | null> {
  const user = await getBasicLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const group = await db.query.groups.findFirst({
    where: (model, { eq }) => eq(model.id, id),
    with: {
      creator: true,
      members: {
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

  return selectGroupSchema.parse({ ...group });
}

export async function getGroupsByIds(ids: string[]): Promise<SelectGroup[]> {
  const user = await getBasicLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const groupRows = await db
    .select()
    .from(groups)
    .where(inArray(groups.id, ids));

  if (!groupRows) {
    throw new Error("Failed to get groups by ids");
  }

  return groupRows.map((row) => {
    return selectBasicGroupSchema.parse({ ...row });
  });
}

export async function getIsUserGroupOwner(groupId: string): Promise<boolean> {
  const user = await getBasicLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const groupMember = await db.query.groupMembers.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, groupId),
        eq(model.userId, userId),
        eq(model.role, "Owner"),
      ),
  });

  return !!groupMember;
}

export async function getGroupMembers(
  groupId: string,
): Promise<SelectBasicGroupMember[]> {
  const user = await getBasicLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const groupMemberRows = await db.query.groupMembers.findMany({
    where: (model, { eq }) => eq(model.groupId, groupId),
    with: { user: true },
  });

  return groupMemberRows.map((groupMemberRow) => {
    return selectGroupMemberSchema.parse({ ...groupMemberRow });
  });
}

export async function getGroupPets(groupId: string): Promise<SelectBasicPet[]> {
  const user = await getBasicLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const groupPetRows = await db.query.groups.findFirst({
    where: (model, { eq }) => eq(model.id, groupId),
    with: {
      petsToGroups: {
        with: {
          pet: { with: { creator: true, owner: true, petImages: true } },
        },
      },
    },
  });

  if (!groupPetRows) {
    throw new Error("Failed to get group pets");
  }

  return groupPetRows.petsToGroups.map((row) => {
    return selectPetSchema.parse({
      ...row.pet,
      owner: selectUserSchema.parse(row.pet.owner),
      creator: selectUserSchema.parse(row.pet.creator),
      images: row.pet.petImages,
    });
  });
}

export async function getUsersPetsNotInGroup(
  groupId: string,
): Promise<SelectBasicPet[]> {
  const user = await getBasicLoggedInUser();

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
    return selectPetSchema.parse({ ...pet });
  });
}

export async function getGroupsUserIsIn(): Promise<SelectGroup[]> {
  const user = await getBasicLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const groupMemberRows = await db.query.groupMembers.findMany({
    where: (model, { eq }) => eq(model.userId, userId),
    with: {
      group: {
        with: {
          creator: true,
          members: { with: { user: true } },
          petsToGroups: {
            with: {
              pet: { with: { petImages: true, owner: true, creator: true } },
            },
          },
        },
      },
    },
  });

  if (!groupMemberRows) {
    throw new Error("Failed to get groups user is in");
  }

  return groupMemberRows.map((row) => {
    return selectGroupSchema.parse({
      ...row.group,
    });
  });
}
