"use server";

import { createPetInputSchema, updatePetSchema } from "~/lib/schemas/pets";
import { db } from "../db";
import { petImages, pets } from "../db/schema";
import { authenticatedProcedure, ownsPetProcedure } from "./zsa-procedures";
import { and, eq, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ratelimit } from "../ratelimit";
import { utapi } from "../uploadthing";
import { createServerAction } from "zsa";

export const createPetAction = authenticatedProcedure
  .createServerAction()
  .input(createPetInputSchema)
  .handler(async ({ input, ctx }) => {
    const { userId } = ctx;
    // Once image upload is locked down to only paying customers we can remove the ratelimiting here
    const { success } = await ratelimit.limit(userId);

    if (!success) {
      throw new Error("You are creating pets too fast");
    }

    const petRow = await db
      .insert(pets)
      .values({
        creatorId: userId,
        ownerId: userId,
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
    const { userId } = ctx;

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

export const deleteOldUnlinkedImagesAction = createServerAction().handler(
  async () => {
    // Images must be at least 2 hours old to be deleted
    const oldUnlinkedImages = await db.query.petImages.findMany({
      where: (model, { and, isNull, lt }) =>
        and(
          isNull(model.petId),
          lt(model.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000)),
        ),
    });

    // Delete from upload thing
    for (const image of oldUnlinkedImages) {
      await utapi.deleteFiles(image.fileKey);
    }

    // Delete from db
    await db
      .delete(petImages)
      .where(
        and(
          isNull(petImages.petId),
          lt(petImages.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000)),
        ),
      )
      .execute();

    return { success: true };
  },
);
