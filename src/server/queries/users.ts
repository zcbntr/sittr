"use server";

import { auth, createClerkClient } from "@clerk/nextjs/server";
import { type User, userSchema } from "~/lib/schemas/users";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function getCurrentLoggedInUser(): Promise<User> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await clerkClient.users.getUser(userId);

  if (!clerkUser) {
    throw new Error("Failed to get user from Clerk");
  }

  return userSchema.parse({
    userId: userId,
    name: clerkUser.fullName,
    avatar: clerkUser.imageUrl,
  });
}

export async function getUserByUserId(userId: string): Promise<User> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await clerkClient.users.getUser(userId);

  if (!clerkUser) {
    throw new Error("Failed to get user from Clerk");
  }

  return userSchema.parse({
    userId: userId,
    name: clerkUser.fullName,
    avatar: clerkUser.imageUrl,
  });
}
