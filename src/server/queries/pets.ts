"use server";

import { db } from "~/server/db";
import {
  type SelectPet,
  selectPetSchema,
  type SelectBasicPet,
} from "~/lib/schemas/pets";
import { getLoggedInUser } from "./users";

export async function getOwnedPetById(petId: string): Promise<SelectBasicPet> {
  const user = await getLoggedInUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const pet = await db.query.pets.findFirst({
    where: (model, { eq }) => eq(model.id, petId),
    with: {
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
): Promise<SelectBasicPet> {
  const user = await getLoggedInUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const pet = await db.query.pets.findFirst({
    where: (model, { eq }) => eq(model.id, petId),
    with: {
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
): Promise<SelectBasicPet[] | string> {
  const user = await getLoggedInUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Convert to a query so we can easily get pet images
  const petsList = await db.query.pets.findMany({
    where: (model, { inArray }) => inArray(model.id, petIds),
    with: {
      petImages: true,
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
      id: pet.id,
      ownerId: pet.ownerId,
      creatorId: pet.creatorId,
      owner: pet.owner,
      creator: pet.creator,
      name: pet.name,
      species: pet.species,
      breed: pet.breed ? pet.breed : undefined,
      dob: pet.dob ? pet.dob : undefined,
      sex: pet.sex ? pet.sex : undefined,
      image: pet.image ? pet.image : undefined,
      note: pet.note ? pet.note : undefined,
    });
  });
}

export async function getOwnedPets(): Promise<SelectPet[]> {
  const user = await getLoggedInUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const ownedPets = await db.query.pets.findMany({
    where: (model, { eq }) => eq(model.ownerId, userId),
    with: {
      petImages: true,
      owner: true,
      creator: true,
    },
  });

  // Turn into zod pet type
  const petsList: SelectPet[] = ownedPets.map((pet) => {
    return selectPetSchema.parse({ ...pet });
  });

  return petsList;
}
