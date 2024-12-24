"use server";

import { type SelectTask, selectTaskSchema } from "~/lib/schemas/tasks";
import { or, not, isNull, inArray } from "drizzle-orm";
import { db } from "../db";
import { tasks } from "../db/schema";
import { TaskTypeEnum } from "~/lib/schemas";
import { getLoggedInUser } from "./users";

export async function getAllOwnedTasks(): Promise<SelectTask[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const userTasks = await db.query.tasks.findMany({
    with: {
      owner: true,
      creator: true,
      claimedBy: true,
      markedAsDoneBy: true,
      group: true,
      pet: { with: { petImages: true } },
    },
    where: (model, { eq }) => eq(model.ownerId, userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const tasksList: SelectTask[] = userTasks.map((task) => {
    return selectTaskSchema.parse({ ...task });
  });

  return tasksList;
}

export async function getOwnedTasksByIds(
  taskIds: string[],
): Promise<SelectTask[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const userWithTasks = await db.query.users.findFirst({
    with: {
      tasksOwned: {
        with: {
          owner: true,
          creator: true,
          claimedBy: true,
          markedAsDoneBy: true,
          group: true,
          pet: { with: { petImages: true } },
        },
      },
    },
    where: (model, { and, eq, inArray }) =>
      and(eq(model.id, userId), inArray(tasks.id, taskIds)),
  });

  if (!userWithTasks) {
    throw new Error("Tasks not found");
  }

  // Turn into task schema
  return userWithTasks.tasksOwned.map((task) => {
    return selectTaskSchema.parse({
      ...task,
    });
  });
}

export async function getOwnedTaskById(taskId: string): Promise<SelectTask> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const task = await db.query.tasks.findFirst({
    with: {
      owner: true,
      creator: true,
      claimedBy: true,
      markedAsDoneBy: true,
      group: true,
      pet: { with: { petImages: true } },
    },
    where: (model, { and, eq }) =>
      and(eq(model.id, taskId), eq(model.ownerId, userId)),
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const parse = selectTaskSchema.safeParse({ ...task });

  if (!parse.success) {
    console.log(parse.error);
    throw new Error("Failed to parse task");
  }

  return parse.data;
}

export async function getVisibleTaskById(taskId: string): Promise<SelectTask> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const task = await db.query.tasks.findFirst({
    with: {
      owner: true,
      creator: true,
      claimedBy: true,
      markedAsDoneBy: true,
      group: true,
      pet: { with: { petImages: true } },
    },
    where: (model, { and, eq }) =>
      and(eq(model.id, taskId), not(eq(model.ownerId, userId))),
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const parse = selectTaskSchema.safeParse({ ...task });

  if (!parse.success) {
    console.log(parse.error);
    throw new Error("Failed to parse task");
  }

  return parse.data;
}

export async function getTasksInRange(
  from: Date,
  to: Date,
  type: TaskTypeEnum,
): Promise<SelectTask[]> {
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

async function getTasksOwnedInRange(
  from: Date,
  to: Date,
): Promise<SelectTask[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const tasksInRange = await db.query.tasks.findMany({
    with: {
      owner: true,
      creator: true,
      claimedBy: true,
      markedAsDoneBy: true,
      group: true,
      pet: { with: { petImages: true } },
    },
    where: (model, { and, eq, gte, lte }) =>
      and(
        eq(model.ownerId, userId),
        or(
          and(gte(model.dateRangeFrom, from), lte(model.dateRangeFrom, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Get user details for creatorId, owner, claimedBy, markedAsDoneBy
  // Turn into task schema
  const tasksList: SelectTask[] = tasksInRange.map((task) => {
    const parse = selectTaskSchema.safeParse({ ...task });

    if (!parse.success) {
      console.log(parse.error);
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}

async function getTasksSittingForInRange(
  from: Date,
  to: Date,
): Promise<SelectTask[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const tasksSittingForInRange = await db.query.tasks.findMany({
    with: {
      owner: true,
      creator: true,
      claimedBy: true,
      markedAsDoneBy: true,
      group: true,
      pet: { with: { petImages: true } },
    },
    where: (model, { and, or, eq, gte, lte }) =>
      and(
        eq(model.claimedById, userId),
        or(
          and(gte(model.dateRangeFrom, from), lte(model.dateRangeFrom, to)),
          and(gte(model.dueDate, from), lte(model.dueDate, to)),
        ),
        not(eq(model.ownerId, userId)),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const tasksList: SelectTask[] = tasksSittingForInRange.map((task) => {
    const parse = selectTaskSchema.safeParse({ ...task });

    if (!parse.success) {
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}

async function getTasksVisibileInRange(
  from: Date,
  to: Date,
): Promise<SelectTask[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const groupsUserIsInRows = await db.query.groupMembers
    .findMany({
      where: (model, { eq }) => eq(model.userId, userId),
    })
    .execute();

  const groupsUserIsInIds = groupsUserIsInRows.map((row) => row.groupId);

  const tasksVisibleViaGroupsUserIn = await db.query.tasks.findMany({
    with: {
      owner: true,
      creator: true,
      claimedBy: true,
      markedAsDoneBy: true,
      group: true,
      pet: { with: { petImages: true } },
    },
    where: (model, { and, or, eq, gte, lte }) =>
      and(
        or(
          and(gte(model.dateRangeFrom, from), lte(model.dateRangeFrom, to)),
          and(gte(model.dueDate, from), lte(model.dueDate, to)),
        ),
        inArray(model.groupId, groupsUserIsInIds),
        not(eq(model.ownerId, userId)),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  const ownedTasks = await db.query.tasks.findMany({
    with: {
      owner: true,
      creator: true,
      claimedBy: true,
      markedAsDoneBy: true,
      group: true,
      pet: { with: { petImages: true } },
    },
    where: (model, { and, or, eq, gte, lte }) =>
      and(
        or(
          and(gte(model.dateRangeFrom, from), lte(model.dateRangeFrom, to)),
          and(gte(model.dueDate, from), lte(model.dueDate, to)),
        ),
        eq(model.ownerId, userId),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  const allTasksVisible = [...tasksVisibleViaGroupsUserIn, ...ownedTasks];

  // Then Turn into task schema
  const tasksList: SelectTask[] = allTasksVisible.map((task) => {
    const parse = selectTaskSchema.safeParse({ ...task });

    if (!parse.success) {
      console.log(parse.error);
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}

async function getTasksUnclaimedInRange(
  from: Date,
  to: Date,
): Promise<SelectTask[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const unclaimedTasksVisibleViaGroupsUserIn = await db.query.tasks.findMany({
    with: {
      owner: true,
      creator: true,
      claimedBy: true,
      markedAsDoneBy: true,
      group: true,
      pet: { with: { petImages: true } },
    },
    where: (model, { and, or, eq, gte, lte }) =>
      and(
        or(
          and(gte(model.dateRangeFrom, from), lte(model.dateRangeFrom, to)),
          and(gte(model.dueDate, from), lte(model.dueDate, to)),
        ),
        isNull(model.claimedById),
        not(eq(model.ownerId, userId)),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const tasksList: SelectTask[] = unclaimedTasksVisibleViaGroupsUserIn.map(
    (task) => {
      const parse = selectTaskSchema.safeParse({ ...task });

      if (!parse.success) {
        console.log(parse.error);
        throw new Error("Failed to parse task");
      }

      return parse.data;
    },
  );

  return tasksList;
}
