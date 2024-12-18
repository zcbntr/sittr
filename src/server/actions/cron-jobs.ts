import { and, gte, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "../db";
import { groupInviteCodes, notifications, petImages, pets } from "../db/schema";
import { utapi } from "../uploadthing";

export async function deleteOldUnlinkedImages() {
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
}

export async function notifyOfPetBirthdays() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // `getMonth` is 0-based
  const currentDay = today.getDate();

  const petsWithBirthdayToday = await db
    .select()
    .from(pets)
    .where(
      sql`EXTRACT(MONTH FROM ${pets.dob}) = ${currentMonth} AND EXTRACT(DAY FROM ${pets.dob}) = ${currentDay}`,
    );

  // Give the pets owners a notification
  for (const pet of petsWithBirthdayToday) {
    await db
      .insert(notifications)
      .values({
        userId: pet.ownerId,
        associatedPet: pet.id,
        message: `Happy birthday ${pet.name}!`,
      })
      .execute();
  }
}

export async function deleteExpiredGroupInviteCodes() {
  await db
    .delete(groupInviteCodes)
    .where(
      or(
        lt(groupInviteCodes.expiresAt, new Date()),
        gte(groupInviteCodes.maxUses, groupInviteCodes.uses),
      ),
    )
    .execute();
}

// Delete notifications older than 90 days
export async function deleteOldNotifications() {
  await db
    .delete(notifications)
    .where(
      lt(
        notifications.createdAt,
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      ),
    )
    .execute();
}
