"use server";

import { auth } from "~/auth";
import { type User, userSchema } from "~/lib/schemas/users";
import { db } from "../db";

export async function getLoggedInUser(): Promise<User | undefined> {
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

  return userSchema.parse(userRow);
}

export async function getUserByUserId(userId: string): Promise<User> {
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

  return userSchema.parse(userRow);
}

export async function getUserByEmail(email: string): Promise<User> {
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

  return userSchema.parse(userRow);
}
