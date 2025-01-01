"use server";

import { auth } from "~/auth";
import {
  type SelectBasicUser,
  selectBasicUserSchema,
  type SelectUser,
  selectUserSchema,
} from "~/lib/schemas/users";
import { db } from "../db";
import { notificationPreferences } from "../db/schema";

export async function getBasicLoggedInUser(): Promise<
  SelectBasicUser | undefined
> {
  const session = await auth();

  const userEmail = session?.user?.email;

  // User has no session or is not logged in
  if (!userEmail) {
    return undefined;
  }

  const userRow = await db.query.users.findFirst({
    where: (model, { eq }) => eq(model.email, userEmail),
  });

  // User has a session but not in the database - something has gone horribly wrong
  if (!userRow) {
    return undefined;
  }

  return selectBasicUserSchema.parse(userRow);
}

// Only additionally ha notification preferences currently - need to figure out how to correctly fetch all relations
export async function getLoggedInUser(): Promise<SelectUser | undefined> {
  const session = await auth();

  const userEmail = session?.user?.email;

  // User has no session or is not logged in
  if (!userEmail) {
    return undefined;
  }

  const userRow = await db.query.users.findFirst({
    where: (model, { eq }) => eq(model.email, userEmail),
    with: {
      notificationPreferences: true,
    },
  });

  // User has a session but not in the database - something has gone horribly wrong
  if (!userRow) {
    return undefined;
  }

  // If preferences dont exist - create them - this is horrificly badly written but works
  if (!userRow.notificationPreferences) {
    const preferences = await db
      .insert(notificationPreferences)
      .values({ userId: userRow.id })
      .returning()
      .execute();

    if (preferences) {
      const userRow = await db.query.users.findFirst({
        where: (model, { eq }) => eq(model.email, userEmail),
        with: {
          notificationPreferences: true,
        },
      });

      // User has a session but not in the database - something has gone horribly wrong
      if (!userRow) {
        return undefined;
      }
    }
  }

  return selectUserSchema.parse(userRow);
}

export async function getUserByUserId(userId: string): Promise<SelectUser> {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userRow = await db.query.users.findFirst({
    where: (model, { eq }) => eq(model.id, userId),
  });

  if (!userRow) {
    throw new Error("User not found");
  }

  return selectUserSchema.parse(userRow);
}

export async function getUserByEmail(email: string): Promise<SelectUser> {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userRow = await db.query.users.findFirst({
    where: (model, { eq }) => eq(model.email, email),
  });

  if (!userRow) {
    throw new Error("User not found");
  }

  return selectUserSchema.parse(userRow);
}
