import { z } from "zod";
import { authenticatedProcedure } from "./zsa-procedures";
import { notifications } from "../db/schema";
import { db } from "../db";
import { and, eq } from "drizzle-orm";

export const markNotificationAsReadAction = authenticatedProcedure
  .createServerAction()
  .input(z.string())
  .handler(async ({ input, ctx }) => {
    const user = ctx.user;

    if (input) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(eq(notifications.id, input), eq(notifications.userId, user.id)),
        )
        .execute();
    } else {
      throw new Error("No notification provided");
    }
  });
