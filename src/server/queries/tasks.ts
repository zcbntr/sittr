"use server";

import { type Task, taskSchema, TaskTypeEnum } from "~/lib/schemas/tasks";
import { eq, and, or, lte, gte, inArray, not, isNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "../db";
import { groups, tasks, usersToGroups } from "../db/schema";
import { union } from "drizzle-orm/pg-core";

export async function getAllOwnedTasks(): Promise<Task[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userTasks = await db.query.tasks.findMany({
    where: (model, { eq }) => eq(model.createdBy, user.userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const tasksList: Task[] = userTasks.map((task) => {
    return taskSchema.parse({
      taskId: task.id,
      ownerId: task.ownerId,
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueDate,
      dateRange: task.dateRangeFrom &&
        task.dateRangeTo && {
          from: task.dateRangeFrom,
          to: task.dateRangeTo,
        },
      petId: task.pet,
      groupId: task.group,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: task.markedAsDoneBy,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy,
    });
  });

  return tasksList;
}

export async function getOwnedTasksByIds(taskIds: string[]): Promise<Task[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const tasksList = await db
    .select()
    .from(tasks)
    .where(inArray(tasks.id, taskIds));

  if (!tasksList) {
    throw new Error("Tasks not found");
  }

  // Turn into task schema
  return tasksList.map((task) => {
    return taskSchema.parse({
      taskId: task.id,
      ownerId: task.ownerId,
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueDate,
      dateRange: task.dateRangeFrom &&
        task.dateRangeTo && {
          from: task.dateRangeFrom,
          to: task.dateRangeTo,
        },
      petId: task.pet,
      groupId: task.group,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: task.markedAsDoneBy,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy,
    });
  });
}

export async function getOwnedTaskById(taskId: string): Promise<Task> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const task = await db.query.tasks.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.id, taskId), eq(model.createdBy, user.userId)),
  });

  if (!task) {
    throw new Error("Task not found");
  }

  return taskSchema.parse({
    taskId: task.id,
    ownerId: task.ownerId,
    name: task.name,
    description: task.description,
    dueMode: task.dueMode,
    dueDate: task.dueDate,
    dateRange: task.dateRangeFrom &&
      task.dateRangeTo && {
        from: task.dateRangeFrom,
        to: task.dateRangeTo,
      },
    petId: task.pet,
    groupId: task.group,
    markedAsDone: task.markedAsDoneBy !== null,
    markedAsDoneBy: task.markedAsDoneBy,
    claimed: task.claimedBy !== null,
    claimedBy: task.claimedBy,
  });
}

export async function getTasksInRange(
  from: Date,
  to: Date,
  type: TaskTypeEnum,
): Promise<Task[]> {
  if (type === TaskTypeEnum.Values.Owned) {
    return getTasksOwnedInRange(from, to);
  } else if (type === TaskTypeEnum.Values["Sitting For"]) {
    return getTasksSittingForInRange(from, to);
  } else if (type === TaskTypeEnum.Values.All) {
    return getTasksVisibileInRange(from, to);
  } else if (type === TaskTypeEnum.Values.Unclaimed) {
    return getTasksUnclaimedInRange(from, to);
  } else {
    throw new Error("Invalid task type");
  }
}

async function getTasksOwnedInRange(from: Date, to: Date): Promise<Task[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const tasksInRange = await db.query.tasks.findMany({
    where: (model, { and, eq, gte, lte }) =>
      and(
        eq(model.createdBy, user.userId),
        or(
          and(gte(model.dateRangeFrom, from), lte(model.dateRangeFrom, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const tasksList: Task[] = tasksInRange.map((task) => {
    return taskSchema.parse({
      taskId: task.id,
      ownerId: task.ownerId,
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueDate,
      dateRange: task.dateRangeFrom &&
        task.dateRangeTo && {
          from: task.dateRangeFrom,
          to: task.dateRangeTo,
        },
      petId: task.pet,
      groupId: task.group,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: task.markedAsDoneBy,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy,
    });
  });

  return tasksList;
}

async function getTasksSittingForInRange(
  from: Date,
  to: Date,
): Promise<Task[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // User should not own the task
  const tasksInRange = await db
    .select()
    .from(tasks)
    .leftJoin(groups, eq(tasks.pet, groups.id))
    .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
    .where(
      and(
        eq(usersToGroups.userId, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeFrom, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
        not(eq(tasks.createdBy, user.userId)),
      ),
    )
    .execute();

  // Turn into task schema
  const tasksList: Task[] = tasksInRange.map((joinedTaskRow) => {
    const parse = taskSchema.safeParse({
      taskId: joinedTaskRow.tasks.id,
      ownerId: joinedTaskRow.tasks.ownerId,
      name: joinedTaskRow.tasks.name,
      description: joinedTaskRow.tasks.description,
      dueMode: joinedTaskRow.tasks.dueMode,
      dueDate: joinedTaskRow.tasks.dueDate,
      dateRange: joinedTaskRow.tasks.dateRangeFrom &&
        joinedTaskRow.tasks.dateRangeTo && {
          from: joinedTaskRow.tasks.dateRangeFrom,
          to: joinedTaskRow.tasks.dateRangeTo,
        },
      petId: joinedTaskRow.tasks.pet,
      groupId: joinedTaskRow.tasks.group,
      markedAsDone: joinedTaskRow.tasks.markedAsDoneBy !== null,
      markedAsDoneBy: joinedTaskRow.tasks.markedAsDoneBy,
      claimed: joinedTaskRow.tasks.claimedBy !== null,
      claimedBy: joinedTaskRow.tasks.claimedBy,
    });

    if (!parse.success) {
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}

async function getTasksVisibileInRange(from: Date, to: Date): Promise<Task[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Get tasks in range where the user is in the group the task is assigned to
  const groupInTasksInRange = db
    .select({
      id: tasks.id,
      ownerId: tasks.createdBy,
      createdBy: tasks.createdBy,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      pet: tasks.pet,
      group: tasks.group,
      claimedBy: tasks.claimedBy,
      markedAsDoneBy: tasks.markedAsDoneBy,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
    .where(
      and(
        eq(usersToGroups.userId, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeTo, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
      ),
    );

  const tasksOwnedInRange = db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.createdBy, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeFrom, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
      ),
    );

  const allTasksVisible = await union(groupInTasksInRange, tasksOwnedInRange);

  // Turn into task schema
  const tasksList: Task[] = allTasksVisible.map((task) => {
    const parse = taskSchema.safeParse({
      taskId: task.id,
      ownerId: task.ownerId,
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueDate,
      dateRange: task.dateRangeFrom &&
        task.dateRangeTo && {
          from: task.dateRangeFrom,
          to: task.dateRangeTo,
        },
      petId: task.pet,
      groupId: task.group,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: task.markedAsDoneBy,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy,
    });

    if (!parse.success) {
      console.log(parse.error);
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}

async function getTasksUnclaimedInRange(from: Date, to: Date): Promise<Task[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Get tasks in range where the user is in the group the task is assigned to
  const groupInTasksInRange = db
    .select({
      id: tasks.id,
      createdBy: tasks.createdBy,
      ownerId: tasks.createdBy,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      pet: tasks.pet,
      group: tasks.group,
      claimedBy: tasks.claimedBy,
      markedAsDoneBy: tasks.markedAsDoneBy,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
    .where(
      and(
        eq(usersToGroups.userId, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeTo, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
        isNull(tasks.claimedBy),
      ),
    );

  const tasksOwnedInRange = db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.createdBy, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeFrom, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
        isNull(tasks.claimedBy),
      ),
    );

  const allTasksVisible = await union(groupInTasksInRange, tasksOwnedInRange);

  // Turn into task schema
  const tasksList: Task[] = allTasksVisible.map((task) => {
    const parse = taskSchema.safeParse({
      taskId: task.id,
      ownerId: task.ownerId,
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueDate,
      dateRange: task.dateRangeFrom &&
        task.dateRangeTo && {
          from: task.dateRangeFrom,
          to: task.dateRangeTo,
        },
      petId: task.pet,
      groupId: task.group,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: task.markedAsDoneBy,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy,
    });

    if (!parse.success) {
      console.log(parse.error);
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}
