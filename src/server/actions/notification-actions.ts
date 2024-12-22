import { z } from "zod";
import { authenticatedProcedure } from "./zsa-procedures";
import { notifications } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export const markNotificationAsReadAction = authenticatedProcedure
  .createServerAction()
  .input(z.string())
  .handler(async ({ input, ctx }) => {
    const user = ctx.user;

    if (input) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, input))
        .execute();
    } else {
      throw new Error("No notification provided");
    }
  });
