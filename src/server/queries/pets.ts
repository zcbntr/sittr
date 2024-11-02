"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { petSchema, type Pet } from "~/lib/schemas/pets";
import { eq, inArray } from "drizzle-orm";
import { type CreatePetFormInput } from "~/app/api/pets/route";
import { pets } from "../db/schema";

export async function createPet(
  pet: CreatePetFormInput,
): Promise<Pet | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const newPet = await db
    .insert(pets)
    .values({
      ownerId: user.userId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      dob: pet.dob,
    })
    .returning();

  if (!newPet?.[0]) {
    throw new Error("Failed to create pet");
  }

  return petSchema.parse({
    id: newPet[0].id,
    ownerId: newPet[0].ownerId,
    name: newPet[0].name,
    species: newPet[0].species,
    breed: newPet[0].breed ? pet.breed : undefined,
    dob: newPet[0].dob,
  });
}

export async function getPetById(petId: string): Promise<Pet | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const pet = await db.query.pets.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.id, petId), eq(model.ownerId, user.userId)),
  });

  if (!pet) {
    throw new Error("Pet not found");
  }

  return petSchema.parse({
    id: pet.id,
    ownerId: pet.ownerId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed ? pet.breed : undefined,
    dob: pet.dob,
  });
}

export async function getPetsByIds(petIds: string[]): Promise<Pet[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const petsList = await db.select().from(pets).where(inArray(pets.id, petIds));

  if (!petsList) {
    throw new Error("Pets not found");
  }

  // Turn into zod pet type
  return petsList.map((pet) => {
    return petSchema.parse({
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed ? pet.breed : undefined,
      dob: pet.dob,
    });
  });
}

export async function getOwnedPets(): Promise<Pet[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const ownedPets = await db.query.pets.findMany({
    where: (model, { eq }) => eq(model.ownerId, user.userId),
  });

  // Turn into zod pet type
  const petsList: Pet[] = ownedPets.map((pet) => {
    return petSchema.parse({
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed ? pet.breed : undefined,
      dob: pet.dob,
    });
  });

  return petsList;
}

export async function updatePet(pet: Pet): Promise<Pet | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const updatedPet = await db
    .update(pets)
    .set({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      dob: pet.dob,
    })
    .where(eq(pets.id, pet.id))
    .returning()
    .execute();

  if (!updatedPet?.[0]) {
    throw new Error("Failed to update pet");
  }

  return petSchema.parse({
    id: updatedPet[0].id,
    ownerId: updatedPet[0].ownerId,
    name: updatedPet[0].name,
    species: updatedPet[0].species,
    breed: updatedPet[0].breed ? updatedPet[0].breed : undefined,
    dob: updatedPet[0].dob,
  });
}

export async function deletePet(petId: string): Promise<Pet | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const petToReturn = await db.transaction(async (db) => {
    const deletedPet = await db
      .delete(pets)
      .where(eq(pets.id, petId))
      .returning();

    if (!deletedPet?.[0]) {
      db.rollback();
      throw new Error("Failed to delete pet from pet table");
    }

    return petSchema.parse({
      id: deletedPet[0].id,
      ownerId: deletedPet[0].ownerId,
      name: deletedPet[0].name,
      species: deletedPet[0].species,
      breed: deletedPet[0].breed ? deletedPet[0].breed : undefined,
      dob: deletedPet[0].dob,
    });
  });

  if (petToReturn) return petToReturn;

  throw new Error("Failed to delete pet");
}
