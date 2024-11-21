import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { db } from "~/server/db";
import { petImages } from "~/server/db/schema";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  createPetImageUploader: f({ image: { maxFileSize: "2MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user) throw new Error("No user was returned from auth()");
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!user.userId) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload

      const petImageRow = await db
        .insert(petImages)
        .values({
          uploadedBy: metadata.userId,
          url: file.url,
        })
        .returning({ insertedId: petImages.id });

      if (!petImageRow || petImageRow.length == 0 || !petImageRow[0]) {
        throw new Error("Failed to insert pet image");
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        uploadedBy: metadata.userId,
        imageId: petImageRow[0].insertedId,
      };
    }),
  editPetImageUploader: f({ image: { maxFileSize: "2MB" } })
    .input(
      z.object({
        petId: z.string(),
      }),
    )
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, input }) => {
      // This code runs on your server before upload
      const user = await auth();

      // If you throw, the user will not be able to upload
      if (!user) throw new Error("No user was returned from auth()");
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!user.userId) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId, petId: input.petId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload

      // Remove old pet image
      await db.delete(petImages).where(eq(petImages.petId, metadata.petId));

      // Create new pet image row
      const newPetImageRow = await db
        .insert(petImages)
        .values({
          uploadedBy: metadata.userId,
          url: file.url,
          petId: metadata.petId,
        })
        .returning({ insertedId: petImages.id });

      if (!newPetImageRow || newPetImageRow.length == 0 || !newPetImageRow[0]) {
        throw new Error("Failed to insert new pet image");
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        uploadedBy: metadata.userId,
        imageId: newPetImageRow[0].insertedId,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
