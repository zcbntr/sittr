"use server";

import { createTaskInputSchema, taskSchema } from "~/lib/schemas/tasks";
import { db } from "~/server/db";
import { tasks } from "~/server/db/schema";
import {
  authenticatedProcedure,
  canMarkTaskAsDoneProcedure,
  ownsTaskProcedure,
} from "./zsa-procedures";
import { and, eq, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ratelimit } from "../ratelimit";

export const createTaskAction = authenticatedProcedure
  .createServerAction()
  .input(createTaskInputSchema)
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;

    const { success } = await ratelimit.limit(user.userId);

    if (!success) {
      throw new Error("You are creating tasks too fast");
    }

    await db
      .insert(tasks)
      .values({
        name: input.name,
        dueMode: input.dueMode,
        ownerId: user.userId,
        dateRangeFrom: input.dateRange?.from,
        dateRangeTo: input.dateRange?.to,
        dueDate: input.dueDate,
        description: input.description,
        pet: input.petId,
        group: input.groupId,
      })
      .execute();

    revalidatePath("/tasks");
  });

export const updateTaskAction = ownsTaskProcedure
  .createServerAction()
  .input(taskSchema)
  .handler(async ({ input, ctx }) => {
    const { user, task } = ctx;

    await db
      .update(tasks)
      .set({
        name: input.name,
        dueMode: input.dueMode,
        dateRangeFrom: input.dateRange?.from,
        dateRangeTo: input.dateRange?.to,
        dueDate: input.dueDate,
        description: input.description,
        pet: input.petId,
        group: input.groupId,
      })
      .where(and(eq(tasks.id, task.id), eq(tasks.ownerId, user.userId)))
      .execute();

    revalidatePath(`/tasks/${task.id}`);
  });

export const toggleTaskMarkedAsDone = canMarkTaskAsDoneProcedure
  .createServerAction()
  .input(taskSchema.pick({ taskId: true }))
  .handler(async ({ input, ctx }) => {
    const { user, task } = ctx;

    // Check if the task is already completed
    if (task.completed) {
      throw new Error("Task is already marked as done");
    }

    // Check if the task is marked as done by the user
    if (task.markedAsDoneBy === user.userId) {
      await db
        .update(tasks)
        .set({
          markedAsDoneBy: null,
        })
        .where(eq(tasks.id, input.taskId))
        .execute();

      revalidatePath(`/tasks/${task.id}`);
    } else if (task.claimedBy !== user.userId) {
      throw new Error("You can't mark a task as done if you didn't claim it");
    } else {
      await db
        .update(tasks)
        .set({
          markedAsDoneBy: user.userId,
        })
        .where(eq(tasks.id, input.taskId))
        .execute();

      revalidatePath(`/tasks/${task.id}`);
    }
  });

export const deleteTaskAction = ownsTaskProcedure
  .createServerAction()
  .input(taskSchema.pick({ taskId: true }))
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;
    const { success } = await ratelimit.limit(user.userId);

    if (!success) {
      throw new Error("You are deleting tasks too fast");
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, input.taskId), eq(tasks.ownerId, user.userId)))
      .execute();

    redirect("/tasks");
  });

export const toggleClaimTaskAction = canMarkTaskAsDoneProcedure
  .createServerAction()
  .input(taskSchema.pick({ taskId: true }))
  .handler(async ({ input, ctx }) => {
    const { user, task } = ctx;
    const { success } = await ratelimit.limit(user.userId);

    if (!success) {
      throw new Error("You are claiming or unclaiming tasks too fast");
    }

    if (task.completed && task.requiresVerification) {
      throw new Error(
        "Task is already marked as completed by the owner. Ask the owner to unmark it as completed in order to unclaim it",
      );
    }

    // Check if the task has been claimed by the user
    if (task?.claimedBy === user.userId) {
      // Check if the task is completed - if so the user cannot unclaim it

      await db
        .update(tasks)
        .set({
          claimedBy: null,
        })
        .where(and(eq(tasks.id, input.taskId), eq(tasks.ownerId, user.userId)))
        .execute();

      revalidatePath("/tasks");
      return;
      // If the task is claimed by another user, the user cannot claim it
    } else if (task?.claimedBy) {
      throw new Error("Task is already claimed by another user");
      // If the task is not completed and not claimed, the user can claim it
    } else {
      await db
        .update(tasks)
        .set({
          claimedBy: user.userId,
        })
        .where(
          and(eq(tasks.id, input.taskId), not(eq(tasks.ownerId, user.userId))),
        )
        .execute();

      revalidatePath("/tasks");
    }
  });
