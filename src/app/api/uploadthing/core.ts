import { and, eq, isNull } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { db } from "~/server/db";
import { petImages } from "~/server/db/schema";
import { getLoggedInUser } from "~/server/queries/users";
import { imageRateLimit } from "~/server/ratelimit";
import { utapi } from "~/server/uploadthing";

const f = createUploadthing();

export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  createPetImageUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({}) => {
      // This code runs on the server before upload
      const user = await getLoggedInUser();
      const userId = user?.id;

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!userId) throw new UploadThingError("Unauthorized");

      const { success } = await imageRateLimit.limit(userId);

      if (!success) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("You are uploading images too fast");
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload

      // Delete existing image(s) for this user missing a pet id
      const existingImages = await db
        .delete(petImages)
        .where(
          and(
            eq(petImages.uploaderId, metadata.userId),
            isNull(petImages.petId),
          ),
        )
        .returning({ fileHash: petImages.fileKey })
        .execute();

      // Remove old image from uploadthing
      await utapi.deleteFiles(existingImages.map((i) => i.fileHash));

      const petImageRow = await db
        .insert(petImages)
        .values({
          uploaderId: metadata.userId,
          url: file.url,
          fileKey: file.key,
        })
        .returning({ insertedId: petImages.id });

      if (!petImageRow || petImageRow.length == 0 || !petImageRow[0]) {
        throw new Error("Failed to insert pet image");
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        uploadedBy: metadata.userId,
        imageId: petImageRow[0].insertedId,
        url: file.url,
      };
    }),
  editPetImageUploader: f({ image: { maxFileSize: "4MB" } })
    .input(
      z.object({
        petId: z.string(),
      }),
    )
    // Set permissions and file types for this FileRoute
    .middleware(async ({ input }) => {
      // This code runs on the server before upload
      const user = await getLoggedInUser();
      const userId = user?.id;

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!userId) throw new UploadThingError("Unauthorized");

      const { success } = await imageRateLimit.limit(userId);

      if (!success) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("You are uploading images too fast");
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: userId, petId: input.petId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload

      // Check for exisiting pet image
      const existingImageRow = await db.query.petImages.findFirst({
        where: eq(petImages.petId, metadata.petId),
      });

      if (!existingImageRow) {
        // Create the pet image in the db
        await db
          .insert(petImages)
          .values({
            uploaderId: metadata.userId,
            url: file.url,
            fileKey: file.key,
            petId: metadata.petId,
          })
          .returning({ insertedId: petImages.id })
          .execute();
      } else {
        // Update the pet image in the db
        await db
          .update(petImages)
          .set({ url: file.url, fileKey: file.key })
          .where(eq(petImages.petId, metadata.petId))
          .returning({ insertedId: petImages.id })
          .execute();
      }

      // Remove old image from uploadthing
      await utapi.deleteFiles(file.fileHash);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        uploadedBy: metadata.userId,
        url: file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
