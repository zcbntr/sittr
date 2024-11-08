"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { petSchema, type Pet } from "~/lib/schemas/pets";
import { inArray } from "drizzle-orm";
import { pets } from "../db/schema";

export async function getPetById(petId: string): Promise<Pet> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const pet = await db.query.pets.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.id, petId), eq(model.ownerId, user.userId)),
  });

  if (!pet) {
    throw new Error("Pet not found");
  }

  return petSchema.parse({
    petId: pet.id,
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
      petId: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed ? pet.breed : undefined,
      dob: pet.dob,
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
  });

  // Turn into zod pet type
  const petsList: Pet[] = ownedPets.map((pet) => {
    return petSchema.parse({
      petId: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed ? pet.breed : undefined,
      dob: pet.dob,
    });
  });

  return petsList;
}
