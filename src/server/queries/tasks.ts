"use server";

import { type Task, taskSchema } from "~/lib/schemas/tasks";
import { eq, and, or, lte, gte, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "../db";
import { groups, tasks, usersToGroups } from "../db/schema";

export async function getOwnedTasksStartingInRange(
  from: Date,
  to: Date,
): Promise<Task[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const tasksInRange = await db.query.tasks.findMany({
    where: (model, { eq, gte, lte, and }) =>
      and(
        eq(model.ownerId, user.userId),
        or(
          and(gte(model.dateRangeFrom, from), lte(model.dateRangeFrom, to)),
          gte(model.dueDate, to),
        ),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const tasksList: Task[] = tasksInRange.map((task) => {
    return taskSchema.parse({
      id: task.id,
      ownerId: task.ownerId,
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueDate,
      dateRange: {
        from: task.dateRangeFrom,
        to: task.dateRangeTo,
      },
      petId: task.pet,
      groupId: task.group,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: task.markedAsDoneBy,
    });
  });

  return tasksList;
}

export async function getAllOwnedTasks(): Promise<Task[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const userTasks = await db.query.tasks.findMany({
    where: (model, { eq }) => eq(model.ownerId, user.userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const tasksList: Task[] = userTasks.map((task) => {
    return taskSchema.parse({
      id: task.id,
      ownerId: task.ownerId,
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueDate,
      dateRange: {
        from: task.dateRangeFrom,
        to: task.dateRangeTo,
      },
      petId: task.pet,
      groupId: task.group,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: task.markedAsDoneBy,
    });
  });

  return tasksList;
}

export async function getOwnedTasksByIds(
  taskIds: string[],
): Promise<Task[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const tasksList = await db
    .select()
    .from(tasks)
    .where(inArray(tasks.id, taskIds));

  if (!tasksList) {
    return "Tasks not found";
  }

  // Turn into task schema
  return tasksList.map((task) => {
    return taskSchema.parse({
      id: task.id,
      ownerId: task.ownerId,
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueDate,
      dateRange: {
        from: task.dateRangeFrom,
        to: task.dateRangeTo,
      },
      petId: task.pet,
      groupId: task.group,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: task.markedAsDoneBy,
    });
  });
}

export async function getOwnedTaskById(taskId: string): Promise<Task | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const task = await db.query.tasks.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.id, taskId), eq(model.ownerId, user.userId)),
  });

  if (!task) {
    return "Task not found";
  }

  return taskSchema.parse({
    id: task.id,
    ownerId: task.ownerId,
    name: task.name,
    description: task.description,
    dueMode: task.dueMode,
    dueDate: task.dueDate,
    dateRange: {
      from: task.dateRangeFrom,
      to: task.dateRangeTo,
    },
    petId: task.pet,
    groupId: task.group,
    markedAsDone: task.markedAsDoneBy !== null,
    markedAsDoneBy: task.markedAsDoneBy,
  });
}

export async function getVisibleTasksInRange(
  from: Date,
  to: Date,
): Promise<Task[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Get tasks in range where the user is the owner or in the group the task is assigned to
  const visibleTasksInRange = await db
    .select()
    .from(tasks)
    .leftJoin(groups, eq(tasks.pet, groups.id))
    .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
    .where(
      and(
        or(
          eq(usersToGroups.userId, user.userId),
          eq(tasks.ownerId, user.userId),
        ),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeFrom, to)),
          gte(tasks.dueDate, to),
        ),
      ),
    )
    .execute();

  // Turn into task schema
  const tasksList: Task[] = visibleTasksInRange.map((joinedTaskRow) => {
    const parse = taskSchema.safeParse({
      id: joinedTaskRow.tasks.id,
      ownerId: joinedTaskRow.tasks.ownerId,
      name: joinedTaskRow.tasks.name,
      description: joinedTaskRow.tasks.description,
      dueMode: joinedTaskRow.tasks.dueMode,
      dueDate: joinedTaskRow.tasks.dueDate,
      dateRange: {
        from: joinedTaskRow.tasks.dateRangeFrom,
        to: joinedTaskRow.tasks.dateRangeTo,
      },
      petId: joinedTaskRow.tasks.pet,
      groupId: joinedTaskRow.groups?.id ?? undefined,
      markedAsDone: joinedTaskRow.tasks.markedAsDoneBy !== null,
      markedAsDoneBy: joinedTaskRow.tasks.markedAsDoneBy,
    });

    if (!parse.success) {
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}