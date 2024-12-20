"use server";

import { db } from "~/server/db";
import { petSchema, type Pet } from "~/lib/schemas/pets";
import { getLoggedInUser } from "./users";

export async function getOwnedPetById(petId: string): Promise<Pet> {
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

  return petSchema.parse({
    id: pet.id,
    ownerId: pet.ownerId,
    creatorId: pet.creatorId,
    owner: pet.owner,
    creator: pet.creator,
    name: pet.name,
    species: pet.species,
    breed: pet.breed ? pet.breed : undefined,
    dob: pet.dob ? pet.dob : undefined,
    sex: pet.sex,
    image: pet.petImages?.url ? pet.petImages.url : undefined,
    note: pet.note ? pet.note : undefined,
  });
}

export async function getPetVisibleViaCommonGroup(petId: string): Promise<Pet> {
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
        with: { group: { with: { usersToGroups: true } } },
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
    return petToGroup.group.usersToGroups.map((userToGroup) => {
      return userToGroup.userId;
    });
  });

  const userGroupIds = userGroups.flat();

  if (!userGroupIds.includes(userId)) {
    throw new Error("Pet not visible");
  }

  return petSchema.parse({
    id: pet.id,
    ownerId: pet.ownerId,
    creatorId: pet.creatorId,
    owner: pet.owner,
    creator: pet.creator,
    name: pet.name,
    species: pet.species,
    breed: pet.breed ? pet.breed : undefined,
    dob: pet.dob ? pet.dob : undefined,
    sex: pet.sex,
    image: pet.petImages?.url ? pet.petImages.url : undefined,
    note: pet.note ? pet.note : undefined,
  });
}

export async function getPetsByIds(petIds: string[]): Promise<Pet[] | string> {
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
    return petSchema.parse({
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

export async function getOwnedPets(): Promise<Pet[]> {
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
  const petsList: Pet[] = ownedPets.map((pet) => {
    return petSchema.parse({
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
      image: pet.petImages?.url ? pet.petImages.url : undefined,
      note: pet.note ? pet.note : undefined,
    });
  });

  return petsList;
}
