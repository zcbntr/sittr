"use server";

import {
  setClaimTaskFormProps,
  setMarkedAsCompleteFormProps,
  selectBasicTaskSchema,
  updateTaskSchema,
  createTaskSchema,
} from "~/lib/schemas/tasks";
import { db } from "~/server/db";
import { notifications, tasks, users } from "~/server/db/schema";
import {
  authenticatedProcedure,
  canMarkTaskAsDoneProcedure,
  ownsTaskProcedure,
} from "./zsa-procedures";
import { and, eq, gte, not, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { basicRatelimit } from "../ratelimit";
import { getVisibleTaskById } from "../queries/tasks";
import { NotificationTypeEnum } from "~/lib/schemas";
import { addMinutes, differenceInMinutes, startOfWeek } from "date-fns";

export const createTaskAction = authenticatedProcedure
  .createServerAction()
  .input(createTaskSchema)
  .handler(async ({ input, ctx }) => {
    const userId = ctx.user.id;

    // Limit non plus users to creating 5 tasks per week. Count tasks created since the start of the week (Monday)
    if (!ctx.user.plusMembership) {
      const lastMonday = startOfWeek(new Date(), { weekStartsOn: 1 });

      const tasksCreatedThisWeek = await db.query.tasks.findMany({
        where: and(
          eq(tasks.creatorId, userId),
          gte(tasks.createdAt, lastMonday),
        ),
        limit: 5,
      });

      if (tasksCreatedThisWeek.length >= 5) {
        throw new Error("You have reached the limit of tasks you can create this week");
      }
    }

    let taskRows = null;

    if (!input.repeatUntil || !input.repeatFrequency) {
      taskRows = await db
        .insert(tasks)
        .values({
          ...input,
          ownerId: userId,
          creatorId: userId,
        })
        .returning()
        .execute();
    } else {
      // Check the user has plus
      if (!ctx.user.plusMembership) {
        throw new Error("You need a plus membership to create repeating tasks");
      }

      // Iterate until the repeatingUntil date
      let currentDate: Date;
      if (input.dateRangeFrom && input.dateRangeTo) {
        const taskDurationMins = differenceInMinutes(
          input.dateRangeTo,
          input.dateRangeFrom,
        );

        let currentDate = new Date(input.dateRangeFrom);

        while (currentDate < input.repeatUntil) {
          taskRows = await db
            .insert(tasks)
            .values({
              ...input,
              ownerId: userId,
              creatorId: userId,
              dateRangeFrom: currentDate,
              dateRangeTo: addMinutes(currentDate, taskDurationMins),
            })
            .returning()
            .execute();

          if (input.repeatFrequency === "Daily") {
            currentDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24);
          } else if (input.repeatFrequency === "Weekly") {
            currentDate = new Date(
              currentDate.getTime() + 1000 * 60 * 60 * 24 * 7,
            );
          } else if (input.repeatFrequency === "Monthly") {
            currentDate = new Date(
              currentDate.getTime() + 1000 * 60 * 60 * 24 * 30,
            );
          }
        }
      } else if (input.dueDate) {
        currentDate = new Date(input.dueDate);

        while (currentDate < input.repeatUntil) {
          taskRows = await db
            .insert(tasks)
            .values({
              ...input,
              ownerId: userId,
              creatorId: userId,
              dueDate: currentDate,
            })
            .returning()
            .execute();

          if (input.repeatFrequency === "Daily") {
            currentDate = new Date(currentDate.getTime() + 1000 * 60 * 60 * 24);
          } else if (input.repeatFrequency === "Weekly") {
            currentDate = new Date(
              currentDate.getTime() + 1000 * 60 * 60 * 24 * 7,
            );
          } else if (input.repeatFrequency === "Monthly") {
            currentDate = new Date(
              currentDate.getTime() + 1000 * 60 * 60 * 24 * 30,
            );
          }
        }
      } else {
        throw new Error(
          "Task date range and due date missing. At least one must be provided.",
        );
      }
    }

    if (!taskRows?.[0]) {
      throw new Error("Failed to create task");
    }

    // If less than 6 hours before the task needs to be completed notify all group members
    const task = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, taskRows[0].id),
        or(
          and(
            eq(tasks.dueMode, false),
            eq(tasks.dateRangeFrom, new Date(Date.now())),
            eq(tasks.dateRangeTo, new Date(Date.now() + 6 * 60 * 60 * 1000)),
          ),
          and(
            eq(tasks.dueMode, true),
            eq(tasks.dueDate, new Date(Date.now() + 6 * 60 * 60 * 1000)),
          ),
        ),
      ),
      with: { group: { with: { members: true } } },
    });

    if (task) {
      for (const member of task.group?.members ?? []) {
        await db
          .insert(notifications)
          .values({
            userId: member.userId,
            associatedTaskId: task.id,
            notificationType:
              NotificationTypeEnum.Values["Upcoming Unclaimed Task"],
            message: `New upcoming task "${task.name}" is due soon!`,
          })
          .returning()
          .execute();
      }
    }

    revalidatePath("/tasks");
  });

export const updateTaskAction = ownsTaskProcedure
  .createServerAction()
  // This needs to become a taskeditschema
  .input(updateTaskSchema)
  .handler(async ({ input, ctx }) => {
    const { userId, task } = ctx;

    if (input?.id) delete input?.id;

    await db
      .update(tasks)
      .set({
        ...input,
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
    if (task.completedAt) {
      throw new Error("Task is already set as completed by the owner");
    }

    // Check if the task is marked as done by the user
    if (task.markedAsDoneById === userId) {
      if (input.markAsDone) {
        throw new Error("Task is already marked as done by you");
      }

      await db
        .update(tasks)
        .set({
          markedAsDoneById: null,
          markedAsDoneAt: null,
        })
        .where(eq(tasks.id, input.id))
        .execute();

      revalidatePath(`/tasks/${task.id}`);
      revalidatePath("/");

      const updatedTask = await getVisibleTaskById(input.id);

      return updatedTask;
    } else if (task.claimedById !== userId) {
      throw new Error("You can't mark a task as done if you didn't claim it");
    } else {
      if (!input.markAsDone) {
        throw new Error("You cannot unmark a task not marked as done by you");
      }

      await db
        .update(tasks)
        .set({
          markedAsDoneById: userId,
          markedAsDoneAt: new Date(),
          claimedById: userId,
          claimedAt: new Date(),
        })
        .where(eq(tasks.id, input.id))
        .execute();

      // Remove any notifications about task being unclaimed or overdue
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.associatedTaskId, input.id),
            or(
              eq(
                notifications.notificationType,
                NotificationTypeEnum.Values["Upcoming Unclaimed Task"],
              ),
              eq(
                notifications.notificationType,
                NotificationTypeEnum.Values["Overdue Task"],
              ),
            ),
          ),
        )
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
            notificationType: NotificationTypeEnum.Values["Completed Task"],
            associatedTaskId: task.id,
          })
          .execute();
      }

      revalidatePath(`/tasks/${task.id}`);
      revalidatePath("/");

      const updatedTask = await getVisibleTaskById(input.id);

      return updatedTask;
    }
  });

export const deleteTaskAction = ownsTaskProcedure
  .createServerAction()
  .input(selectBasicTaskSchema.pick({ id: true }))
  .handler(async ({ input, ctx }) => {
    const { userId } = ctx;
    const { success } = await basicRatelimit.limit(userId);

    if (!success) {
      throw new Error("You are deleting tasks too fast");
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, input.id), eq(tasks.ownerId, userId)))
      .execute();

    // Delete all notifications associated with the task
    await db
      .delete(notifications)
      .where(eq(notifications.associatedTaskId, input.id))
      .execute();

    revalidatePath("/tasks");
    revalidatePath("/");
  });

export const setClaimTaskAction = canMarkTaskAsDoneProcedure
  .createServerAction()
  .input(setClaimTaskFormProps)
  .handler(async ({ input, ctx }) => {
    const { userId, task } = ctx;

    if (task.completedAt && task.requiresVerification) {
      throw new Error(
        "Task is already marked as completed by the owner. Ask the owner to unmark it as completed in order to unclaim it",
      );
    }

    // Check if the task has been claimed by the user
    if (task?.claimedById === userId) {
      if (input.claim) {
        throw new Error("Task is already claimed by you");
      }

      // Unclaim the task and unset marked as done
      await db
        .update(tasks)
        .set({
          claimedById: null,
          claimedAt: null,
          markedAsDoneById: null,
          markedAsDoneAt: null,
        })
        .where(and(eq(tasks.id, input.id), not(eq(tasks.ownerId, userId))))
        .returning()
        .execute();

      // If task is due within 6 hours, notify all group members
      if (
        (task.dueDate &&
          task.dueDate < new Date(Date.now() + 6 * 60 * 60 * 1000)) ||
        (task.dateRangeFrom &&
          task.dateRangeFrom < new Date(Date.now() + 6 * 60 * 60 * 1000))
      ) {
        const taskWithGroup = await db.query.tasks.findFirst({
          where: eq(tasks.id, input.id),
          with: { group: { with: { members: true } } },
        });

        if (!taskWithGroup) {
          throw new Error("Task not found");
        }

        for (const member of taskWithGroup.group?.members ?? []) {
          await db
            .insert(notifications)
            .values({
              userId: member.userId,
              associatedTaskId: task.id,
              notificationType:
                NotificationTypeEnum.Values["Upcoming Unclaimed Task"],
              message: `Task "${task.name}" is due soon!`,
            })
            .returning()
            .execute();
        }
      }

      revalidatePath("/");
      revalidatePath(`/tasks/${task.id}`);

      const updatedTask = await getVisibleTaskById(input.id);

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
          claimedById: userId,
          claimedAt: new Date(),
        })
        .where(and(eq(tasks.id, input.id), not(eq(tasks.ownerId, userId))))
        .returning()
        .execute();

      if (updatedRow.length === 0) {
        throw new Error(
          "Failed to claim task. This may be due to poor network conditions, or you may be trying to claim a task you own.",
        );
      }

      // Remove any notifications about task being unclaimed
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.associatedTaskId, input.id),
            eq(
              notifications.notificationType,
              NotificationTypeEnum.Values["Upcoming Unclaimed Task"],
            ),
          ),
        )
        .execute();

      revalidatePath("/");
      revalidatePath(`/tasks/${task.id}`);

      const updatedTask = await getVisibleTaskById(input.id);

      return updatedTask;
    }
  });
