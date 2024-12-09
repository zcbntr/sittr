"use server";

import { auth } from "~/auth";
import { User, userSchema } from "~/lib/schemas/users";
import { db } from "../db";

export async function getCurrentLoggedInUser(): Promise<User> {
  const session = await auth();

  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const userRow = await db.query.users.findFirst({
    where: (model, { eq }) => eq(model.id, userId),
  });

  if (!userRow) {
    throw new Error("User not found");
  }

  return userSchema.parse({
    id: userId,
    name: userRow?.name,
    email: userRow?.email,
    emailVerified: userRow.emailVerified,
    image: userRow.image,
  });
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

  return userSchema.parse({
    id: userId,
    name: userRow?.name,
    email: userRow?.email,
    emailVerified: userRow.emailVerified,
    image: userRow.image,
  });
}
