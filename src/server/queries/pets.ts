"use server";

import { db } from "~/server/db";
import { type SelectPet, selectPetSchema } from "~/lib/schemas/pets";
import { getBasicLoggedInUser } from "./users";
import { type SelectBasicUser } from "~/lib/schemas/users";

export async function getOwnedPetById(petId: string): Promise<SelectPet> {
  const user = await getBasicLoggedInUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const pet = await db.query.pets.findFirst({
    where: (model, { eq }) => eq(model.id, petId),
    with: {
      profilePic: true,
      petImages: true,
      owner: true,
      creator: true,
    },
  });

  if (!pet) {
    throw new Error("Pet not found");
  }

  return selectPetSchema.parse({ ...pet });
}

export async function getPetVisibleViaCommonGroup(
  petId: string,
): Promise<SelectPet> {
  const user = await getBasicLoggedInUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const pet = await db.query.pets.findFirst({
    where: (model, { eq }) => eq(model.id, petId),
    with: {
      profilePic: true,
      petImages: true,
      owner: true,
      creator: true,
      petsToGroups: {
        with: { group: { with: { members: true } } },
      },
    },
  });

  if (!pet) {
    throw new Error("Pet not found");
  }

  if (!pet.petsToGroups) {
    throw new Error("Pet not visible");
  }

  // Iterate through the groups and check if the user is in any of them
  const userGroups = pet.petsToGroups.map((petToGroup) => {
    return petToGroup.group.members.map((member) => {
      return member.userId;
    });
  });

  const userGroupIds = userGroups.flat();

  if (!userGroupIds.includes(userId)) {
    throw new Error("Pet not visible");
  }

  return selectPetSchema.parse({ ...pet });
}

export async function getPetsByIds(
  petIds: string[],
): Promise<SelectPet[] | string> {
  const user = await getBasicLoggedInUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Convert to a query so we can easily get pet images
  const petsList = await db.query.pets.findMany({
    where: (model, { inArray }) => inArray(model.id, petIds),
    with: {
      profilePic: true,
      owner: true,
      creator: true,
    },
  });

  if (!petsList) {
    throw new Error("Pets not found");
  }

  // Turn into zod pet type
  return petsList.map((pet) => {
    return selectPetSchema.parse({
      ...pet,
    });
  });
}

export async function getOwnedPets(): Promise<SelectPet[]> {
  const user = await getBasicLoggedInUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const ownedPetsRows = await db.query.pets.findMany({
    where: (model, { eq }) => eq(model.ownerId, userId),
    with: {
      profilePic: true,
      owner: true,
      creator: true,
    },
  });

  // Turn into zod pet type
  const petsList: SelectPet[] = ownedPetsRows.map((pet) => {
    return selectPetSchema.parse({ ...pet });
  });

  return petsList;
}

export async function getWhoCanSeePetById(
  petId: string,
): Promise<SelectBasicUser[]> {
  const user = await getBasicLoggedInUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const pet = await db.query.pets.findFirst({
    where: (model, { eq }) => eq(model.id, petId),
    with: {
      petsToGroups: {
        with: { group: { with: { members: { with: { user: true } } } } },
      },
    },
  });

  if (!pet) {
    throw new Error("Pet not found");
  }

  if (!pet.petsToGroups) {
    throw new Error("Pet not visible");
  }

  // Iterate through the groups and check if the user is in any of them
  const groupsWithMemberUsers = pet.petsToGroups.map((petToGroup) => {
    return petToGroup.group.members.map((member) => {
      return member.user;
    });
  });

  const usersPetVisibleTo = groupsWithMemberUsers.flat();

  return usersPetVisibleTo;
}
