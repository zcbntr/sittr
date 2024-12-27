"use server";

import { insertPetSchema, updatePetSchema } from "~/lib/schemas/pets";
import { db } from "../db";
import { petImages, petProfilePics, pets } from "../db/schema";
import { authenticatedProcedure, ownsPetProcedure } from "./zsa-procedures";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ratelimit } from "../ratelimit";
import { utapi } from "../uploadthing";

export const createPetAction = authenticatedProcedure
  .createServerAction()
  .input(insertPetSchema)
  .handler(async ({ input, ctx }) => {
    const user = ctx.user;

    // Once image upload is locked down to only paying customers we can remove the ratelimiting here
    const { success } = await ratelimit.limit(user.id);

    if (!success) {
      throw new Error("You are creating pets too fast");
    }

    // Check how many pets the user has
    const petCountRows = await db.query.pets.findMany({
      where: (model, { eq }) => eq(model.ownerId, user.id),
    });

    const petCount = petCountRows.length;

    if (
      (user.plusMembership && petCount >= 100) ||
      (!user.plusMembership && petCount >= 2)
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

    if (input?.id) delete input?.id;

    await db
      .update(pets)
      .set({ ...input })
      .where(and(eq(pets.id, pet.id), eq(pets.ownerId, userId)))
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

export const deletePetProfilePicAction = ownsPetProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, ctx }) => {
    const { pet } = ctx;
    const { id } = input;

    const deletedProfPicRow = await db
      .delete(petProfilePics)
      .where(and(eq(petProfilePics.petId, id)))
      .returning({ fileKey: petProfilePics.fileKey })
      .execute();

    if (
      !deletedProfPicRow ||
      deletedProfPicRow.length == 0 ||
      !deletedProfPicRow[0]
    ) {
      throw new Error("Failed to delete pet image");
    }

    // Remove old image from uploadthing
    await utapi.deleteFiles(deletedProfPicRow[0].fileKey);

    revalidatePath(`/pets/${pet.id}`);
    revalidatePath(`/pets/${pet.id}?editing=true`);
  });

export const deletePetImageAction = ownsPetProcedure
  .createServerAction()
  .input(z.object({ id: z.string(), imageId: z.string() }))
  .handler(async ({ input, ctx }) => {
    const { pet } = ctx;
    const { id } = input;

    const deletedImageRow = await db
      .delete(petImages)
      .where(and(eq(petImages.petId, id), eq(petImages.id, input.imageId)))
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
