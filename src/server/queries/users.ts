"use server";

import { auth } from "~/auth";
import { type User, userSchema } from "~/lib/schemas/users";
import { db } from "../db";
import { redirect } from "next/navigation";

export async function getLoggedInUser(): Promise<User> {
  const session = await auth();

  const userEmail = session?.user?.email;

  if (!userEmail) {
    redirect("/");
  }

  const userRow = await db.query.users.findFirst({
    where: (model, { eq }) => eq(model.email, userEmail),
  });

  if (!userRow) {
    throw new Error("User not found");
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
