"use server";

import { createPetInputSchema, petSchema } from "~/lib/schemas/pets";
import { db } from "../db";
import { pets } from "../db/schema";
import { authenticatedProcedure, ownsPetProcedure } from "./zsa-procedures";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const createPetAction = authenticatedProcedure
  .createServerAction()
  .input(createPetInputSchema)
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;

    await db
      .insert(pets)
      .values({
        ownerId: user.userId,
        name: input.name,
        species: input.species,
        breed: input.breed,
        dob: input.dob,
      })
      .execute();
  });

export const updatePetAction = ownsPetProcedure
  .createServerAction()
  .input(petSchema)
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;

    await db
      .update(pets)
      .set({
        name: input.name,
        species: input.species,
        breed: input.breed,
        dob: input.dob,
      })
      .where(and(eq(pets.id, input.id), eq(pets.ownerId, user.userId)))
      .execute();
  });

export const deletePetAction = authenticatedProcedure
  .createServerAction()
  .input(z.string())
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;

    await db
      .delete(pets)
      .where(and(eq(pets.id, input), eq(pets.ownerId, user.userId)))
      .execute();
  });
