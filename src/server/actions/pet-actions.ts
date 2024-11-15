"use server";

import { createPetInputSchema, petSchema } from "~/lib/schemas/pets";
import { db } from "../db";
import { pets } from "../db/schema";
import { authenticatedProcedure, ownsPetProcedure } from "./zsa-procedures";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ratelimit } from "../ratelimit";

export const createPetAction = authenticatedProcedure
  .createServerAction()
  .input(createPetInputSchema)
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;
    const { success } = await ratelimit.limit(user.userId);

    if (!success) {
      throw new Error("You are creating pets too fast");
    }

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

    revalidatePath(`/pets/`);
  });

export const updatePetAction = ownsPetProcedure
  .createServerAction()
  .input(petSchema)
  .handler(async ({ input, ctx }) => {
    const { user, pet } = ctx;

    await db
      .update(pets)
      .set({
        name: input.name,
        species: input.species,
        breed: input.breed,
        dob: input.dob,
      })
      .where(and(eq(pets.id, input.petId), eq(pets.ownerId, user.userId)))
      .execute();

    revalidatePath(`/pets/${pet.id}`);
  });

export const deletePetAction = authenticatedProcedure
  .createServerAction()
  .input(z.object({ petId: z.string() }))
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;
    const { success } = await ratelimit.limit(user.userId);

    if (!success) {
      throw new Error("You are deleting pets too fast");
    }

    await db
      .delete(pets)
      .where(and(eq(pets.id, input.petId), eq(pets.ownerId, user.userId)))
      .execute();

    redirect(`/pets`);
  });
