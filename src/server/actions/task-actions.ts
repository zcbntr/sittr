"use server";

import { createTaskInputSchema, taskSchema } from "~/lib/schemas/tasks";
import { db } from "~/server/db";
import { tasks } from "~/server/db/schema";
import {
  authenticatedProcedure,
  canMarkTaskAsDoneProcedure,
  ownsTaskProcedure,
} from "./zsa-procedures";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const createTaskAction = authenticatedProcedure
  .createServerAction()
  .input(createTaskInputSchema)
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;

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
  .input(taskSchema.pick({ id: true }))
  .handler(async ({ input, ctx }) => {
    const { user, task } = ctx;

    await db
      .update(tasks)
      .set({
        markedAsDoneBy: user.userId,
      })
      .where(eq(tasks.id, input.id))
      .execute();

    revalidatePath(`/tasks/${task.id}`);
  });

export const deleteTaskAction = ownsTaskProcedure
  .createServerAction()
  .input(taskSchema.pick({ id: true }))
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, input.id), eq(tasks.ownerId, user.userId)))
      .execute();

    redirect("/tasks");
  });
