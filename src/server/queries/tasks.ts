"use server";

import { type Task, taskSchema } from "~/lib/schemas/tasks";
import { eq, and, or, lte, gte, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "../db";
import { groups, tasks, usersToGroups } from "../db/schema";
import { type CreateTask } from "~/lib/schemas";

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

export async function createTask(task: CreateTask): Promise<Task | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const newTask = await db
    .insert(tasks)
    .values({
      name: task.name,
      dueMode: task.dueMode,
      ownerId: user.userId,
      dateRangeFrom: task.dateRange?.from,
      dateRangeTo: task.dateRange?.to,
      dueDate: task.dueDate,
      description: task.description,
      pet: task.petId,
      group: task.groupId,
    })
    .returning()
    .execute();

  if (newTask[0]) {
    return taskSchema.parse({
      id: newTask[0].id,
      ownerId: newTask[0].ownerId,
      name: newTask[0].name,
      description: newTask[0].description,
      dueMode: newTask[0].dueMode,
      dueDate: newTask[0].dueDate,
      dateRange: { from: newTask[0].dateRangeFrom, to: newTask[0].dateRangeTo },
      petId: newTask[0].pet,
      groupId: newTask[0].group,
      markedAsDone: newTask[0].markedAsDoneBy !== null,
      markedAsDoneBy: newTask[0].markedAsDoneBy,
    });
  }

  throw new Error("Failed to create task");
}

export async function updateTask(task: Task): Promise<Task | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const updatedTask = await db
    .update(tasks)
    .set({
      name: task.name,
      dueMode: task.dueMode,
      dateRangeFrom: task.dateRange?.from,
      dateRangeTo: task.dateRange?.to,
      dueDate: task.dueDate,
      description: task.description,
      pet: task.petId,
    })
    .where(and(eq(tasks.id, task.id), eq(tasks.ownerId, user.userId)))
    .returning()
    .execute();

  if (!updatedTask?.[0]) {
    return "Task not found";
  }

  // Check if the task has been marked as done
  // If so, update the markedAsDoneBy field, if the user is the owner or the task is unmarked, or the user is the one who marked it
  if (
    updatedTask[0].markedAsDoneBy != user.userId &&
    (user.userId == updatedTask[0].ownerId ||
      updatedTask[0].markedAsDoneBy == null ||
      user.userId == updatedTask[0].markedAsDoneBy)
  ) {
    const updatedTaskChangedMarkedAsDoneBy = await db
      .update(tasks)
      .set({
        markedAsDoneBy: user.userId,
      })
      .where(eq(tasks.id, task.id))
      .returning()
      .execute();

    // Return a task object with the data from the updated task including the markedAsDoneBy field
    if (updatedTaskChangedMarkedAsDoneBy[0]) {
      return taskSchema.parse({
        id: updatedTaskChangedMarkedAsDoneBy[0].id,
        ownerId: updatedTaskChangedMarkedAsDoneBy[0].ownerId,
        name: updatedTaskChangedMarkedAsDoneBy[0].name,
        description: updatedTaskChangedMarkedAsDoneBy[0].description,
        dueMode: updatedTaskChangedMarkedAsDoneBy[0].dueMode,
        dueDate: updatedTaskChangedMarkedAsDoneBy[0].dueDate,
        dateRange: {
          from: updatedTaskChangedMarkedAsDoneBy[0].dateRangeFrom,
          to: updatedTaskChangedMarkedAsDoneBy[0].dateRangeTo,
        },
        petId: updatedTaskChangedMarkedAsDoneBy[0].pet,
        groupId: updatedTaskChangedMarkedAsDoneBy[0].group,
        markedAsDone:
          updatedTaskChangedMarkedAsDoneBy[0].markedAsDoneBy !== null,
        markedAsDoneBy: updatedTaskChangedMarkedAsDoneBy[0].markedAsDoneBy,
      });
    }

    throw new Error("Failed to mark task as done");
  }

  // Return a task object with the data from the updated task
  return taskSchema.parse({
    id: updatedTask[0].id,
    ownerId: updatedTask[0].ownerId,
    name: updatedTask[0].name,
    description: updatedTask[0].description,
    dueMode: updatedTask[0].dueMode,
    dueDate: updatedTask[0].dueDate,
    dateRange: {
      from: updatedTask[0].dateRangeFrom,
      to: updatedTask[0].dateRangeTo,
    },
    petId: updatedTask[0].pet,
    groupId: updatedTask[0].group,
    markedAsDone: updatedTask[0].markedAsDoneBy !== null,
    markedAsDoneBy: updatedTask[0].markedAsDoneBy,
  });
}

export async function deleteOwnedTask(id: string): Promise<Task | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const deletedTask = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, user.userId)))
    .returning()
    .execute();

  if (deletedTask[0]) {
    return taskSchema.parse({
      id: deletedTask[0].id,
      ownerId: deletedTask[0].ownerId,
      name: deletedTask[0].name,
      description: deletedTask[0].description,
      dueMode: deletedTask[0].dueMode,
      dueDate: deletedTask[0].dueDate,
      dateRange: {
        from: deletedTask[0].dateRangeFrom,
        to: deletedTask[0].dateRangeTo,
      },
      petId: deletedTask[0].pet,
      groupId: deletedTask[0].group,
      markedAsDone: deletedTask[0].markedAsDoneBy !== null,
      markedAsDoneBy: deletedTask[0].markedAsDoneBy,
    });
  }

  throw new Error("Failed to delete task");
}
