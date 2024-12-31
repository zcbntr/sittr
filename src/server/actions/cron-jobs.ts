import { and, gte, inArray, isNotNull, lt, or, sql } from "drizzle-orm";
import { db } from "../db";
import { groupInviteCodes, notifications, petImages, pets } from "../db/schema";
import { utapi } from "../uploadthing";
import { NotificationTypeEnum } from "~/lib/schemas";

export async function deleteOldUnlinkedImages(): Promise<number> {
  const [petImages, petProfilePics] = await Promise.all([
    deleteOldUnlinkedPetImages(),
    deleteOldUnlinkedPetProfilePics(),
  ]);

  return petImages.length + petProfilePics.length;
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

  let count = 0;

  // Give the pets owners a notification
  for (const pet of petsWithBirthdayToday) {
    // Check for existing notification

    const existingNotificationRow = await db.query.notifications.findFirst({
      where: (model, { and, eq }) =>
        and(
          eq(model.associatedPetId, pet.id),
          eq(
            model.notificationType,
            NotificationTypeEnum.Values["Pet Birthday"],
          ),
        ),
    });

    if (existingNotificationRow) {
      continue;
    }

    const row = await db
      .insert(notifications)
      .values({
        userId: pet.ownerId,
        associatedPetId: pet.id,
        notificationType: NotificationTypeEnum.Values["Pet Birthday"],
        message: `Happy birthday ${pet.name}!`,
      })
      .returning()
      .execute();

    if (row) count++;
  }

  return count;
}

// Delete expired group invite codes (those who have expired or reached their max uses)
export async function deleteExpiredGroupInviteCodes() {
  const rows = await db
    .delete(groupInviteCodes)
    .where(
      or(
        lt(groupInviteCodes.expiresAt, new Date()),
        gte(groupInviteCodes.maxUses, groupInviteCodes.uses),
      ),
    )
    .returning()
    .execute();

  return rows.length;
}

// Delete notifications older than 90 days
export async function deleteOldNotifications() {
  const rows = await db
    .delete(notifications)
    .where(
      lt(
        notifications.createdAt,
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      ),
    )
    .returning()
    .execute();

  return rows.length;
}

// Notify users of their tasks which they have claimed but are overdue (by 1 hour)
export async function notifyOverdueTasks() {
  const rows = await db.query.tasks.findMany({
    where: (model, { and, gte, isNull, lt }) =>
      and(
        isNull(model.markedAsDoneById),
        isNotNull(model.claimedById),
        gte(model.claimedAt, new Date(Date.now() - 60 * 60 * 1000)),
        lt(model.claimedAt, new Date(Date.now() - 2 * 60 * 60 * 1000)),
      ),
  });

  let count = 0;
  for (const task of rows) {
    // Please compiler, we already know this to be not null/undefined
    if (!task.claimedById) continue;

    // Check no notification has already been sent for this task
    const existingNotificationRow = await db.query.notifications.findFirst({
      where: (model, { eq }) =>
        and(
          eq(model.associatedTaskId, task.id),
          eq(
            model.notificationType,
            NotificationTypeEnum.Values["Overdue Task"],
          ),
        ),
    });

    if (existingNotificationRow) {
      continue;
    }

    const row = await db
      .insert(notifications)
      .values({
        userId: task.claimedById,
        associatedTaskId: task.id,
        notificationType: NotificationTypeEnum.Values["Overdue Task"],
        message: `Task "${task.name}" is overdue!`,
      })
      .returning()
      .execute();

    if (row) count++;
  }

  return count;
}

// Notify all group members of tasks upcomming (within 6 hours) which are unclaimed
export async function notifyUpcomingUnclaimedTasks() {
  const rows = await db.query.tasks.findMany({
    where: (model, { and, gte, isNull, lt }) =>
      and(
        isNull(model.markedAsDoneById),
        isNull(model.claimedById),
        or(
          and(
            gte(model.dueDate, new Date(Date.now())),
            lt(model.dueDate, new Date(Date.now() + 6 * 60 * 60 * 1000)),
          ),
          and(
            gte(model.dateRangeFrom, new Date(Date.now())),
            lt(model.dateRangeFrom, new Date(Date.now() + 6 * 60 * 60 * 1000)),
          ),
        ),
      ),
    with: { group: { with: { members: true } } },
  });

  let count = 0;
  for (const task of rows) {
    // Check no notification has already been sent for this task
    const existingNotification = await db.query.notifications.findFirst({
      where: (model, { eq }) =>
        and(
          eq(model.associatedTaskId, task.id),
          eq(
            model.notificationType,
            NotificationTypeEnum.Values["Upcoming Unclaimed Task"],
          ),
        ),
    });

    if (existingNotification) {
      continue;
    }

    for (const user of task.group?.members ?? []) {
      const row = await db
        .insert(notifications)
        .values({
          userId: user.userId,
          associatedTaskId: task.id,
          notificationType:
            NotificationTypeEnum.Values["Upcoming Unclaimed Task"],
          message: `Task "${task.name}" is due soon!`,
        })
        .returning()
        .execute();

      if (row) count++;
    }
  }

  return count;
}

async function deleteOldUnlinkedPetImages(): Promise<string[]> {
  // Images must be at least 2 hours old to be deleted and not be connected to a user account or pet
  const oldUnlinkedPetImages = await db.query.petImages.findMany({
    where: (model, { and, isNull, lt }) =>
      or(
        isNull(model.uploaderId),
        and(
          isNull(model.petId),
          lt(model.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000)),
        ),
      ),
  });

  // Delete from UT
  const imageKeys: string[] = oldUnlinkedPetImages.map((row) => row.fileKey);
  const rowToDeleteIds: string[] = [];
  const errorKeys: string[] = [];
  for (const imageKey of imageKeys) {
    const { success } = await utapi.deleteFiles(imageKey);
    if (success) {
      rowToDeleteIds.push(imageKey);
    } else {
      errorKeys.push(imageKey);
    }
  }

  if (errorKeys.length > 0) {
    console.error(
      `UploadThing image deletion of orphened pet images failed.\nFailed to delete: ${errorKeys.length} images.\n${errorKeys.join(", ")}`,
    );
  }

  // Delete from db only the images that have been successfully deleted from UT
  await db
    .delete(petImages)
    .where(inArray(petImages.id, rowToDeleteIds))
    .execute();

  return rowToDeleteIds;
}

async function deleteOldUnlinkedPetProfilePics(): Promise<string[]> {
  // Images must be at least 2 hours old to be deleted and not be connected to a pet
  // Or belong to a deleted user
  const oldUnlinkedPetImages = await db.query.petProfilePics.findMany({
    where: (model, { and, isNull, lt }) =>
      or(
        isNull(model.uploaderId),
        and(
          isNull(model.petId),
          lt(model.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000)),
        ),
      ),
  });

  // Delete from UT
  const imageKeys = oldUnlinkedPetImages.map((row) => row.fileKey);
  const rowToDeleteIds: string[] = [];
  const errorKeys: string[] = [];
  for (const imageKey of imageKeys) {
    const { success } = await utapi.deleteFiles(imageKey);
    if (success) {
      rowToDeleteIds.push(imageKey);
    } else {
      errorKeys.push(imageKey);
    }
  }

  if (errorKeys.length > 0) {
    console.error(
      `UploadThing image deletion of orphened pet profile pics failed.\nFailed to delete: ${errorKeys.length} images.\n${errorKeys.join(", ")}`,
    );
  }

  // Delete from db only the images that have been successfully deleted from UT
  await db
    .delete(petImages)
    .where(inArray(petImages.id, rowToDeleteIds))
    .execute();

  return rowToDeleteIds;
}
