"use server";

import {
  createTaskInputSchema,
  setClaimTaskFormProps,
  setMarkedAsCompleteFormProps,
  taskSchema,
  updateTaskInputSchema,
} from "~/lib/schemas/tasks";
import { db } from "~/server/db";
import { notifications, tasks, users } from "~/server/db/schema";
import {
  authenticatedProcedure,
  canMarkTaskAsDoneProcedure,
  ownsTaskProcedure,
} from "./zsa-procedures";
import { and, eq, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ratelimit } from "../ratelimit";
import { getVisibleTaskById } from "../queries/tasks";

export const createTaskAction = authenticatedProcedure
  .createServerAction()
  .input(createTaskInputSchema)
  .handler(async ({ input, ctx }) => {
    const userId = ctx.user.id;

    await db
      .insert(tasks)
      .values({
        name: input.name,
        dueMode: input.dueMode,
        creatorId: userId,
        ownerId: userId,
        dateRangeFrom: !input.dueMode ? input.dateRange?.from : null,
        dateRangeTo: !input.dueMode ? input.dateRange?.to : null,
        dueDate: input.dueMode ? input.dueDate : null,
        description: input.description,
        pet: input.petId,
        group: input.groupId,
      })
      .execute();

    revalidatePath("/tasks");
  });

export const updateTaskAction = ownsTaskProcedure
  .createServerAction()
  // This needs to become a taskeditschema
  .input(updateTaskInputSchema)
  .handler(async ({ input, ctx }) => {
    const { userId, task } = ctx;

    await db
      .update(tasks)
      .set({
        name: input.name,
        dueMode: input.dueMode,
        dateRangeFrom: !input.dueMode ? input.dateRange?.from : null,
        dateRangeTo: !input.dueMode ? input.dateRange?.to : null,
        dueDate: input.dueMode ? input.dueDate : null,
        description: input.description,
        pet: input.petId,
        group: input.groupId,
      })
      .where(and(eq(tasks.id, task.id), eq(tasks.ownerId, userId)))
      .execute();

    revalidatePath(`/tasks/${task.id}`);
  });

export const setTaskMarkedAsDoneAction = canMarkTaskAsDoneProcedure
  .createServerAction()
  .input(setMarkedAsCompleteFormProps)
  .handler(async ({ input, ctx }) => {
    const { userId, task } = ctx;

    // Check if the task is already completed
    if (task.completed) {
      throw new Error("Task is already marked as done");
    }

    // Check if the task is marked as done by the user
    if (task.markedAsDoneBy === userId) {
      if (input.markAsDone) {
        throw new Error("Task is already marked as done by you");
      }

      await db
        .update(tasks)
        .set({
          markedAsDoneBy: null,
          markedAsDoneAt: null,
        })
        .where(eq(tasks.id, input.taskId))
        .execute();

      revalidatePath(`/tasks/${task.id}`);
      revalidatePath("/");

      const updatedTask = await getVisibleTaskById(input.taskId);

      return updatedTask;
    } else if (task.claimedBy !== userId) {
      throw new Error("You can't mark a task as done if you didn't claim it");
    } else {
      if (!input.markAsDone) {
        throw new Error("You cannot unmark a task not marked as done by you");
      }

      await db
        .update(tasks)
        .set({
          markedAsDoneBy: userId,
          markedAsDoneAt: new Date(),
          claimedBy: userId,
          claimedAt: new Date(),
        })
        .where(eq(tasks.id, input.taskId))
        .execute();

      // Notify the owner of the task that the task has been marked as done
      const owner = await db.query.users.findFirst({
        where: eq(users.id, task.ownerId),
      });

      const markedAsDoneBy = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (owner) {
        await db
          .insert(notifications)
          .values({
            userId: owner.id,
            message: `Your task "${task.name}" has been marked as done by ${markedAsDoneBy?.name}`,
            associatedTask: task.id,
          })
          .execute();
      }

      revalidatePath(`/tasks/${task.id}`);
      revalidatePath("/");

      const updatedTask = await getVisibleTaskById(input.taskId);

      return updatedTask;
    }
  });

export const deleteTaskAction = ownsTaskProcedure
  .createServerAction()
  .input(taskSchema.pick({ taskId: true }))
  .handler(async ({ input, ctx }) => {
    const { userId } = ctx;
    const { success } = await ratelimit.limit(userId);

    if (!success) {
      throw new Error("You are deleting tasks too fast");
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, input.taskId), eq(tasks.ownerId, userId)))
      .execute();

    revalidatePath("/tasks");
    revalidatePath("/");
  });

export const setClaimTaskAction = canMarkTaskAsDoneProcedure
  .createServerAction()
  .input(setClaimTaskFormProps)
  .handler(async ({ input, ctx }) => {
    const { userId, task } = ctx;

    if (task.completed && task.requiresVerification) {
      throw new Error(
        "Task is already marked as completed by the owner. Ask the owner to unmark it as completed in order to unclaim it",
      );
    }

    // Check if the task has been claimed by the user
    if (task?.claimedBy === userId) {
      if (input.claim) {
        throw new Error("Task is already claimed by you");
      }

      // Unclaim the task and unset marked as done
      await db
        .update(tasks)
        .set({
          claimedBy: null,
          claimedAt: null,
          markedAsDoneBy: null,
          markedAsDoneAt: null,
        })
        .where(and(eq(tasks.id, input.taskId), not(eq(tasks.ownerId, userId))))
        .execute();

      revalidatePath("/");
      revalidatePath(`/tasks/${task.id}`);

      const updatedTask = await getVisibleTaskById(input.taskId);

      return updatedTask;
      // If the task is claimed by another user, the user cannot claim it
    } else if (task?.claimedBy) {
      throw new Error("Task is already claimed by another user");
      // If the task is not completed and not claimed, the user can claim it
    } else {
      if (!input.claim) {
        throw new Error("You cannot unclaim a task not claimed by you");
      }

      const updatedRow = await db
        .update(tasks)
        .set({
          claimedBy: userId,
          claimedAt: new Date(),
        })
        .where(and(eq(tasks.id, input.taskId), not(eq(tasks.ownerId, userId))))
        .returning()
        .execute();

      if (updatedRow.length === 0) {
        throw new Error(
          "Failed to claim task. This may be due to poor network conditions, or you may be trying to claim a task you own.",
        );
      }

      revalidatePath("/");
      revalidatePath(`/tasks/${task.id}`);

      const updatedTask = await getVisibleTaskById(input.taskId);

      return updatedTask;
    }
  });
