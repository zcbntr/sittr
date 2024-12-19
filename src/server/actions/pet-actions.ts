"use server";

import { createPetInputSchema, updatePetSchema } from "~/lib/schemas/pets";
import { db } from "../db";
import { petImages, pets } from "../db/schema";
import { authenticatedProcedure, ownsPetProcedure } from "./zsa-procedures";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ratelimit } from "../ratelimit";
import { utapi } from "../uploadthing";

export const createPetAction = authenticatedProcedure
  .createServerAction()
  .input(createPetInputSchema)
  .handler(async ({ input, ctx }) => {
    const user = ctx.user;

    // Once image upload is locked down to only paying customers we can remove the ratelimiting here
    const { success } = await ratelimit.limit(user.id);

    if (!success) {
      throw new Error("You are creating pets too fast");
    }

    // Check how many pets the user has
    const petCount = await db
      .select({ count: count() })
      .from(pets)
      .where(eq(pets.ownerId, user.id))
      .execute();

    if (!petCount[0]?.count) {
      throw new Error("Failed to count user's pets");
    }

    if (
      (user.plusMembership && petCount[0]?.count >= 100) ||
      (!user.plusMembership && petCount[0]?.count >= 2)
    ) {
      throw new Error(
        "You have reached the maximum number of pets for your plan type",
      );
    }

    const petRow = await db
      .insert(pets)
      .values({
        creatorId: user.id,
        ownerId: user.id,
        name: input.name,
        species: input.species,
        breed: input.breed,
        dob: input.dob,
        sex: input.sex,
        image: input.image,
        note: input.note,
      })
      .returning({ insertedId: pets.id })
      .execute();

    if (input.image) {
      await db
        .update(petImages)
        .set({ petId: petRow[0]?.insertedId })
        .where(eq(petImages.id, input.image))
        .execute();
    }

    revalidatePath(`/pets/`);
  });

export const updatePetAction = ownsPetProcedure
  .createServerAction()
  .input(updatePetSchema)
  .handler(async ({ input, ctx }) => {
    const { userId, pet } = ctx;

    await db
      .update(pets)
      .set({
        name: input.name,
        species: input.species,
        breed: input.breed,
        dob: input.dob,
        sex: input.sex,
        note: input.note,
      })
      .where(and(eq(pets.id, input.petId), eq(pets.ownerId, userId)))
      .execute();

    revalidatePath(`/pets/${pet.id}`);
  });

export const deletePetAction = authenticatedProcedure
  .createServerAction()
  .input(z.object({ petId: z.string() }))
  .handler(async ({ input, ctx }) => {
    const userId = ctx.user.id;

    await db
      .delete(pets)
      .where(and(eq(pets.id, input.petId), eq(pets.ownerId, userId)))
      .execute();

    redirect(`/pets`);
  });

export const deletePetImageAction = ownsPetProcedure
  .createServerAction()
  .input(z.object({ petId: z.string() }))
  .handler(async ({ input, ctx }) => {
    const { pet } = ctx;
    const { petId } = input;

    const deletedImageRow = await db
      .delete(petImages)
      .where(and(eq(petImages.petId, petId)))
      .returning({ fileKey: petImages.fileKey })
      .execute();

    if (
      !deletedImageRow ||
      deletedImageRow.length == 0 ||
      !deletedImageRow[0]
    ) {
      throw new Error("Failed to delete pet image");
    }

    // Remove old image from uploadthing
    await utapi.deleteFiles(deletedImageRow[0].fileKey);

    revalidatePath(`/pets/${pet.id}`);
    revalidatePath(`/pets/${pet.id}?editing=true`);
  });
