"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { petSchema, type Pet } from "~/lib/schemas/pets";
import { eq, and, or, inArray } from "drizzle-orm";
import { petImages, pets, petsToGroups, usersToGroups } from "../db/schema";

export async function getPetById(petId: string): Promise<Pet> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Allow users who are members of a group which sits for the pet to view the pet
  // This will give two rows of each pet if the owner is also a member of a group which sits for the pet
  // Not a big issue as we limit to 1, but could be optimized
  const petRows = await db
    .select()
    .from(pets)
    .leftJoin(petsToGroups, eq(petsToGroups.petId, pets.id))
    .leftJoin(usersToGroups, eq(usersToGroups.groupId, petsToGroups.groupId))
    .leftJoin(petImages, eq(petImages.petId, pets.id))
    .where(
      and(
        eq(pets.id, petId),
        or(
          eq(usersToGroups.userId, user.userId),
          eq(pets.ownerId, user.userId),
        ),
      ),
    )
    .limit(1);

  if (!petRows || petRows.length === 0 || petRows[0] === undefined) {
    throw new Error("Pet not found");
  }

  const petRow = petRows[0];

  return petSchema.parse({
    petId: petRow.pets.id,
    ownerId: petRow.pets.ownerId,
    createdBy: petRow.pets.createdBy,
    name: petRow.pets.name,
    species: petRow.pets.species,
    breed: petRow.pets.breed ? petRow.pets.breed : undefined,
    dob: petRow.pets.dob ? petRow.pets.dob : undefined,
    sex: petRow.pets.sex ? petRow.pets.sex : undefined,
    image: petRow.pet_images?.url ? petRow.pet_images.url : undefined,
    note: petRow.pets.note ? petRow.pets.note : undefined,
  });
}

export async function getPetsByIds(petIds: string[]): Promise<Pet[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Convert to a query so we can easily get pet images
  const petsList = await db.select().from(pets).where(inArray(pets.id, petIds));

  if (!petsList) {
    throw new Error("Pets not found");
  }

  // Turn into zod pet type
  return petsList.map((pet) => {
    return petSchema.parse({
      petId: pet.id,
      ownerId: pet.ownerId,
      createdBy: pet.createdBy,
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
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const ownedPets = await db.query.pets.findMany({
    where: (model, { eq }) => eq(model.ownerId, user.userId),
    with: {
      petImages: true,
    },
  });

  // Turn into zod pet type
  const petsList: Pet[] = ownedPets.map((pet) => {
    return petSchema.parse({
      petId: pet.id,
      ownerId: pet.ownerId,
      createdBy: pet.createdBy,
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
