import { and, eq, isNull } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { db } from "~/server/db";
import { petProfilePics, taskInstructionImages } from "~/server/db/schema";
import { getLoggedInUser } from "~/server/queries/users";
import { multiImageRateLimit, singleImageRateLimit } from "~/server/ratelimit";
import { utapi } from "~/server/uploadthing";

const f = createUploadthing();

// Options in docs https://docs.uploadthing.com/file-routes

export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  unlinkedPetProfilePicUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({}) => {
      // This code runs on the server before upload
      const user = await getLoggedInUser();
      const userId = user?.id;

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!userId) throw new UploadThingError("Unauthorized");

      const { success } = await singleImageRateLimit.limit(userId);

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
        .delete(petProfilePics)
        .where(
          and(
            eq(petProfilePics.uploaderId, metadata.userId),
            isNull(petProfilePics.petId),
          ),
        )
        .returning({ fileHash: petProfilePics.fileKey })
        .execute();

      // Remove old image from uploadthing
      await utapi.deleteFiles(existingImages.map((i) => i.fileHash));

      const petImageRow = await db
        .insert(petProfilePics)
        .values({
          uploaderId: metadata.userId,
          url: file.url,
          fileKey: file.key,
        })
        .returning({ insertedId: petProfilePics.id });

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
  petProfilePicUploader: f({ image: { maxFileSize: "4MB" } })
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

      const { success } = await singleImageRateLimit.limit(userId);

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
      const existingImageRow = await db.query.petProfilePics.findFirst({
        where: eq(petProfilePics.petId, metadata.petId),
      });

      let imageRow;

      if (!existingImageRow) {
        // Create the pet image in the db
        imageRow = await db
          .insert(petProfilePics)
          .values({
            uploaderId: metadata.userId,
            url: file.url,
            fileKey: file.key,
            petId: metadata.petId,
          })
          .returning({ insertedId: petProfilePics.id })
          .execute();
      } else {
        // Remove old image from uploadthing
        await utapi.deleteFiles(existingImageRow?.fileKey);

        // Update the pet image in the db
        imageRow = await db
          .update(petProfilePics)
          .set({ url: file.url, fileKey: file.key })
          .where(eq(petProfilePics.petId, metadata.petId))
          .returning({ insertedId: petProfilePics.id })
          .execute();
      }

      if (!imageRow || imageRow.length == 0 || !imageRow[0]) {
        throw new Error("Failed to insert pet image");
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        uploadedBy: metadata.userId,
        imageId: imageRow[0].insertedId,
        url: file.url,
      };
    }),
  createTaskInstructionImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
  })
    .input(z.object({ taskId: z.string() }))
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, input }) => {
      // This code runs on the server before upload
      const user = await getLoggedInUser();
      const userId = user?.id;

      // TODO
      // Check if the task already has max instruction images
      // TODO

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!userId) throw new UploadThingError("Unauthorized");

      const { success } = await multiImageRateLimit.limit(userId);

      if (!success) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw new UploadThingError("You are uploading images too fast");
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: userId, taskId: input.taskId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload

      const taskInstructionImageRow = await db
        .insert(taskInstructionImages)
        .values({
          taskId: metadata.taskId,
          uploaderId: metadata.userId,
          url: file.url,
          fileKey: file.key,
        })
        .returning({ insertedId: petProfilePics.id });

      if (
        !taskInstructionImageRow ||
        taskInstructionImageRow.length == 0 ||
        !taskInstructionImageRow[0]
      ) {
        throw new Error("Failed to insert task instruction image");
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        uploadedBy: metadata.userId,
        imageId: taskInstructionImageRow[0].insertedId,
        url: file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
