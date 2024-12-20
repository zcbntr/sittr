"use server";

import { type Task, taskSchema } from "~/lib/schemas/tasks";
import { or, not, isNull, inArray } from "drizzle-orm";
import { db } from "../db";
import { tasks } from "../db/schema";
import { userSchema } from "~/lib/schemas/users";
import { petSchema } from "~/lib/schemas/pets";
import { groupSchema } from "~/lib/schemas/groups";
import { TaskTypeEnum } from "~/lib/schemas";
import { getLoggedInUser } from "./users";

export async function getAllOwnedTasks(): Promise<Task[]> {
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
  const tasksList: Task[] = userTasks.map((task) => {
    return taskSchema.parse({
      taskId: task.id,
      owner: userSchema.parse(task.owner),
      createdBy: userSchema.parse(task.creatorId),
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueMode ? task.dueDate : undefined,
      dateRange:
        !task.dueMode && task.dateRangeFrom && task.dateRangeTo
          ? {
              from: task.dateRangeFrom,
              to: task.dateRangeTo,
            }
          : undefined,
      pet: task.pet
        ? petSchema.parse({
            id: task.pet,
            name: task.pet.name,
            ownerId: task.pet.ownerId,
            createdBy: task.pet.creatorId,
            species: task.pet.species,
            breed: task.pet.breed,
            dob: task.pet.dob,
            sex: task.pet.sex,
            image: task.pet.petImages ? task.pet.petImages.url : undefined,
          })
        : null,
      group: task.group
        ? groupSchema.parse({
            groupId: task.group.id,
            name: task.group.name,
            description: task.group.description,
            createdBy: task.group.creatorId,
          })
        : null,
      markedAsDoneBy: task.markedAsDoneBy
        ? userSchema.parse(task.markedAsDoneBy)
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy ? userSchema.parse(task.claimedBy) : null,
      claimedAt: task.claimedAt,
    });
  });

  return tasksList;
}

export async function getOwnedTasksByIds(taskIds: string[]): Promise<Task[]> {
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
    return taskSchema.parse({
      taskId: task.id,
      owner: userSchema.parse(task.owner),
      createdBy: userSchema.parse(task.creator),
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueMode ? task.dueDate : undefined,
      dateRange:
        !task.dueMode && task.dateRangeFrom && task.dateRangeTo
          ? {
              from: task.dateRangeFrom,
              to: task.dateRangeTo,
            }
          : undefined,
      pet: task.pet ? petSchema.parse(task.pet) : null,
      group: task.group ? groupSchema.parse(task.group) : null,
      markedAsDoneBy: task.markedAsDoneBy
        ? userSchema.parse(task.markedAsDoneBy)
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy ? userSchema.parse(task.claimedBy) : null,
      claimedAt: task.claimedAt,
    });
  });
}

export async function getOwnedTaskById(taskId: string): Promise<Task> {
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

  const parse = taskSchema.safeParse({
    taskId: task.id,
    owner: userSchema.parse(task.owner),
    createdBy: userSchema.parse(task.creatorId),
    name: task.name,
    description: task.description,
    dueMode: task.dueMode,
    dueDate: task.dueMode ? task.dueDate : undefined,
    dateRange:
      !task.dueMode && task.dateRangeFrom && task.dateRangeTo
        ? {
            from: task.dateRangeFrom,
            to: task.dateRangeTo,
          }
        : undefined,
    pet: task.pet ? petSchema.parse(task.pet) : null,
    group: task.group ? groupSchema.parse(task.group) : null,
    markedAsDoneBy: task.markedAsDoneBy
      ? userSchema.parse(task.markedAsDoneBy)
      : null,
    markedAsDoneAt: task.markedAsDoneAt,
    claimed: task.claimedBy !== null,
    claimedBy: task.claimedBy ? userSchema.parse(task.claimedBy) : null,
    claimedAt: task.claimedAt,
  });

  if (!parse.success) {
    console.log(parse.error);
    throw new Error("Failed to parse task");
  }

  return parse.data;
}

export async function getVisibleTaskById(taskId: string): Promise<Task> {
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

  const parse = taskSchema.safeParse({
    taskId: task.id,
    owner: userSchema.parse(task.owner),
    createdBy: userSchema.parse(task.creatorId),
    name: task.name,
    description: task.description,
    dueMode: task.dueMode,
    dueDate: task.dueMode ? task.dueDate : undefined,
    dateRange:
      !task.dueMode && task.dateRangeFrom && task.dateRangeTo
        ? {
            from: task.dateRangeFrom,
            to: task.dateRangeTo,
          }
        : undefined,
    pet: task.pet ? petSchema.parse(task.pet) : null,
    group: task.group ? groupSchema.parse(task.group) : null,
    markedAsDoneBy: task.markedAsDoneBy
      ? userSchema.parse(task.markedAsDoneBy)
      : null,
    markedAsDoneAt: task.markedAsDoneAt,
    claimed: task.claimedBy !== null,
    claimedBy: task.claimedBy ? userSchema.parse(task.claimedBy) : null,
    claimedAt: task.claimedAt,
  });

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

  // Get user details for createdBy, owner, claimedBy, markedAsDoneBy
  // Turn into task schema
  const tasksList: Task[] = tasksInRange.map((task) => {
    const parse = taskSchema.safeParse({
      taskId: task.id,
      owner: userSchema.parse(task.owner),
      createdBy: userSchema.parse(task.creatorId),
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueMode ? task.dueDate : undefined,
      dateRange:
        !task.dueMode && task.dateRangeFrom && task.dateRangeTo
          ? {
              from: task.dateRangeFrom,
              to: task.dateRangeTo,
            }
          : undefined,
      pet: task.pet ? petSchema.parse(task.pet) : null,
      group: task.group ? groupSchema.parse(task.group) : null,
      markedAsDoneBy: task.markedAsDoneBy
        ? userSchema.parse(task.markedAsDoneBy)
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy ? userSchema.parse(task.claimedBy) : null,
      claimedAt: task.claimedAt,
    });

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
): Promise<Task[]> {
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
        eq(model.claimedBy, userId),
        or(
          and(gte(model.dateRangeFrom, from), lte(model.dateRangeFrom, to)),
          and(gte(model.dueDate, from), lte(model.dueDate, to)),
        ),
        not(eq(model.ownerId, userId)),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const tasksList: Task[] = tasksSittingForInRange.map((task) => {
    const parse = taskSchema.safeParse({
      taskId: task.id,
      owner: userSchema.parse(task.owner),
      createdBy: userSchema.parse(task.creatorId),
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueMode ? task.dueDate : undefined,
      dateRange:
        !task.dueMode && task.dateRangeFrom && task.dateRangeTo
          ? {
              from: task.dateRangeFrom,
              to: task.dateRangeTo,
            }
          : undefined,
      pet: task.pet
        ? petSchema.parse({
            id: task.pet.id,
            name: task.pet.name,
            ownerId: task.pet.ownerId,
            creatorId: task.pet.creatorId,
            species: task.pet.species,
            breed: task.pet.breed,
            sex: task.pet.sex,
            dob: task.pet.dob,
            image: task.pet.petImages ? task.pet.petImages.url : undefined,
          })
        : null,
      group: task.group ? groupSchema.parse(task.group) : null,
      markedAsDoneBy: task.markedAsDoneBy
        ? userSchema.parse(task.markedAsDoneBy)
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy ? userSchema.parse(task.claimedBy) : null,
      claimedAt: task.claimedAt,
    });

    if (!parse.success) {
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}

async function getTasksVisibileInRange(from: Date, to: Date): Promise<Task[]> {
  const user = await getLoggedInUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const groupsUserIsInRows = await db.query.usersToGroups
    .findMany({
      where: (model, { eq }) => eq(model.userId, userId),
    })
    .execute();

  const groupsUserIsInIds = groupsUserIsInRows.map((row) => row.groupId);

  // Check user is in the group!
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
        inArray(model.group, groupsUserIsInIds),
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
  const tasksList: Task[] = allTasksVisible.map((task) => {
    const parse = taskSchema.safeParse({
      taskId: task.id,
      owner: userSchema.parse(task.owner),
      createdBy: userSchema.parse(task.creator),
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueMode ? task.dueDate : undefined,
      dateRange:
        !task.dueMode && task.dateRangeFrom && task.dateRangeTo
          ? {
              from: task.dateRangeFrom,
              to: task.dateRangeTo,
            }
          : undefined,
      pet: task.pet
        ? petSchema.parse({
            id: task.pet.id,
            name: task.pet.name,
            ownerId: task.pet.ownerId,
            creatorId: task.pet.creatorId,
            species: task.pet.species,
            breed: task.pet.breed,
            sex: task.pet.sex,
            dob: task.pet.dob,
            image: task.pet.petImages ? task.pet.petImages.url : undefined,
          })
        : undefined,
      group: task.group ? groupSchema.parse(task.group) : undefined,
      markedAsDoneBy: task.markedAsDoneBy
        ? userSchema.parse(task.markedAsDoneBy)
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimed: task.claimedBy !== null,
      claimedBy: task.claimedBy ? userSchema.parse(task.claimedBy) : null,
      claimedAt: task.claimedAt,
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
        isNull(model.claimedBy),
        not(eq(model.ownerId, userId)),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const tasksList: Task[] = unclaimedTasksVisibleViaGroupsUserIn.map((task) => {
    const parse = taskSchema.safeParse({
      taskId: task.id,
      owner: userSchema.parse(task.owner),
      createdBy: userSchema.parse(task.creatorId),
      name: task.name,
      description: task.description,
      dueMode: task.dueMode,
      dueDate: task.dueMode ? task.dueDate : undefined,
      dateRange:
        !task.dueMode && task.dateRangeFrom && task.dateRangeTo
          ? {
              from: task.dateRangeFrom,
              to: task.dateRangeTo,
            }
          : undefined,
      pet: task.pet
        ? petSchema.parse({
            id: task.pet.id,
            name: task.pet.name,
            ownerId: task.pet.ownerId,
            creatorId: task.pet.creatorId,
            species: task.pet.species,
            breed: task.pet.breed,
            sex: task.pet.sex,
            dob: task.pet.dob,
            image: task.pet.petImages ? task.pet.petImages.url : undefined,
          })
        : null,
      group: task.group ? groupSchema.parse(task.group) : null,
      markedAsDoneBy: task.markedAsDoneBy
        ? userSchema.parse(task.markedAsDoneBy)
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimedBy: task.claimedBy ? userSchema.parse(task.claimedBy) : null,
      claimedAt: task.claimedAt,
    });

    if (!parse.success) {
      console.log(parse.error);
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}
