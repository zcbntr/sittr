"use server";

import { type Task, taskSchema, TaskTypeEnum } from "~/lib/schemas/tasks";
import { eq, and, or, lte, gte, inArray, not, isNull } from "drizzle-orm";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import { db } from "../db";
import { groups, pets, petsToGroups, tasks, usersToGroups } from "../db/schema";
import { union } from "drizzle-orm/pg-core";
import { userSchema } from "~/lib/schemas/users";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function getAllOwnedTasks(): Promise<Task[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userTasks = await db.query.tasks.findMany({
    where: (model, { eq }) => eq(model.ownerId, user.userId),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Turn into task schema
  const clerkUsers = await clerkClient.users.getUserList();
  const tasksList: Task[] = userTasks.map((task) => {
    let claimingUser = null;
    let markedAsDoneUser = null;

    const createdByUser = clerkUsers.data.find(
      (user) => user.id === task.createdBy,
    );

    if (!createdByUser) {
      throw new Error(
        "User creating task not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

    if (!ownerUser) {
      throw new Error(
        "User owning task not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.claimedBy !== null) {
      claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

      if (!claimingUser) {
        throw new Error(
          "User claiming task not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User marking task as done not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    return taskSchema.parse({
      taskId: task.id,
      owner: userSchema.parse({
        id: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        id: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
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
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            id: markedAsDoneUser?.id,
            name: markedAsDoneUser?.fullName,
            avatar: markedAsDoneUser?.imageUrl,
          })
        : null,
      claimed: task.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            id: claimingUser?.id,
            name: claimingUser?.fullName,
            avatar: claimingUser?.imageUrl,
          })
        : null,
    });
  });

  return tasksList;
}

export async function getOwnedTasksByIds(taskIds: string[]): Promise<Task[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const joinedTasksList = await db
    .select()
    .from(tasks)
    .leftJoin(usersToGroups, eq(tasks.group, usersToGroups.groupId))
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .where(and(inArray(tasks.id, taskIds), eq(tasks.ownerId, user.userId)));

  if (!joinedTasksList) {
    throw new Error("Tasks not found");
  }

  // Get user details for createdBy, owner, claimedBy, markedAsDoneBy
  // Turn into task schema
  const clerkUsers = await clerkClient.users.getUserList();
  return joinedTasksList.map((task) => {
    let claimingUser = null;
    let markedAsDoneUser = null;

    const createdByUser = clerkUsers.data.find(
      (user) => user.id === task.tasks.createdBy,
    );

    if (!createdByUser) {
      throw new Error(
        "User creating task not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find(
      (user) => user.id === task.tasks.ownerId,
    );

    if (!ownerUser) {
      throw new Error(
        "User owning task not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.tasks.claimedBy !== null) {
      claimingUser = clerkUsers.data.find(
        (user) => user.id === task.tasks.claimedBy,
      );

      if (!claimingUser) {
        throw new Error(
          "User claiming task not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.tasks.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.tasks.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User marking task as done not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    return taskSchema.parse({
      taskId: task.tasks.id,
      owner: userSchema.parse({
        id: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        id: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
      name: task.tasks.name,
      description: task.tasks.description,
      dueMode: task.tasks.dueMode,
      dueDate: task.tasks.dueDate,
      dateRange: task.tasks.dateRangeFrom &&
        task.tasks.dateRangeTo && {
          from: task.tasks.dateRangeFrom,
          to: task.tasks.dateRangeTo,
        },
      petId: task.tasks.pet,
      petName: task.pets?.name,
      groupId: task.tasks.group,
      groupName: task.groups?.name,
      markedAsDone: task.tasks.markedAsDoneBy !== null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            id: markedAsDoneUser?.id,
            name: markedAsDoneUser?.fullName,
            avatar: markedAsDoneUser?.imageUrl,
          })
        : null,
      claimed: task.tasks.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            id: claimingUser?.id,
            name: claimingUser?.fullName,
            avatar: claimingUser?.imageUrl,
          })
        : null,
    });
  });
}

export async function getOwnedTaskById(taskId: string): Promise<Task> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const task = await db.query.tasks.findFirst({
    with: { group: true, pet: true },
    where: (model, { and, eq }) =>
      and(eq(model.id, taskId), eq(model.ownerId, user.userId)),
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Get user details for createdBy, owner, claimedBy, markedAsDoneBy
  const clerkUsers = await clerkClient.users.getUserList();

  let claimingUser = null;
  let markedAsDoneUser = null;

  const createdByUser = clerkUsers.data.find(
    (user) => user.id === task.createdBy,
  );

  if (!createdByUser) {
    throw new Error(
      "User creating task not found in Clerk. The user may have deleted their account.",
    );
  }

  const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

  if (!ownerUser) {
    throw new Error(
      "User owning task not found in Clerk. The user may have deleted their account.",
    );
  }

  if (task.claimedBy !== null) {
    claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

    if (!claimingUser) {
      throw new Error(
        "User claiming task not found in Clerk. The user may have deleted their account.",
      );
    }
  }

  if (task.markedAsDoneBy !== null) {
    markedAsDoneUser = clerkUsers.data.find(
      (user) => user.id === task.markedAsDoneBy,
    );

    if (!markedAsDoneUser) {
      throw new Error(
        "User marking task as done not found in Clerk. The user may have deleted their account.",
      );
    }
  }

  // Turn into task schema
  return taskSchema.parse({
    taskId: task.id,
    owner: userSchema.parse({
      id: ownerUser?.id,
      name: ownerUser?.fullName,
      avatar: ownerUser?.imageUrl,
    }),
    createdBy: userSchema.parse({
      id: createdByUser?.id,
      name: createdByUser?.fullName,
      avatar: createdByUser?.imageUrl,
    }),
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
    petName: task.pet?.name,
    groupId: task.group,
    groupName: task.group?.name,
    markedAsDone: task.markedAsDoneBy !== null,
    markedAsDoneBy: markedAsDoneUser
      ? userSchema.parse({
          id: markedAsDoneUser?.id,
          name: markedAsDoneUser?.fullName,
          avatar: markedAsDoneUser?.imageUrl,
        })
      : null,
    claimed: task.claimedBy !== null,
    claimedBy: claimingUser
      ? userSchema.parse({
          id: claimingUser?.id,
          name: claimingUser?.fullName,
          avatar: claimingUser?.imageUrl,
        })
      : null,
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
    with: { group: true, pet: true },
    where: (model, { and, eq, gte, lte }) =>
      and(
        eq(model.ownerId, user.userId),
        or(
          and(gte(model.dateRangeFrom, from), lte(model.dateRangeFrom, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
      ),
    orderBy: (model, { desc }) => desc(model.createdAt),
  });

  // Get user details for createdBy, owner, claimedBy, markedAsDoneBy
  // Turn into task schema
  const clerkUsers = await clerkClient.users.getUserList();
  const tasksList: Task[] = tasksInRange.map((task) => {
    let claimingUser = null;
    let markedAsDoneUser = null;

    const createdByUser = clerkUsers.data.find(
      (user) => user.id === task.createdBy,
    );

    if (!createdByUser) {
      throw new Error(
        "User creating task not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

    if (!ownerUser) {
      throw new Error(
        "User owning task not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.claimedBy !== null) {
      claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

      if (!claimingUser) {
        throw new Error(
          "User claiming task not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User marking task as done not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    return taskSchema.parse({
      taskId: task.id,
      owner: userSchema.parse({
        id: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        id: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
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
      petName: task.pet?.name,
      groupId: task.group,
      groupName: task.group?.name,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            id: markedAsDoneUser?.id,
            name: markedAsDoneUser?.fullName,
            avatar: markedAsDoneUser?.imageUrl,
          })
        : null,
      claimed: task.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            id: claimingUser?.id,
            name: claimingUser?.fullName,
            avatar: claimingUser?.imageUrl,
          })
        : null,
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
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .where(
      and(
        eq(usersToGroups.userId, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeFrom, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
        not(eq(tasks.ownerId, user.userId)),
      ),
    )
    .execute();

  // Get user details for createdBy, owner, claimedBy, markedAsDoneBy
  // Turn into task schema
  const clerkUsers = await clerkClient.users.getUserList();
  const tasksList: Task[] = tasksInRange.map((joinedTaskRow) => {
    let claimingUser = null;
    let markedAsDoneUser = null;

    const createdByUser = clerkUsers.data.find(
      (user) => user.id === joinedTaskRow.tasks.createdBy,
    );

    if (!createdByUser) {
      throw new Error(
        "User creating task not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find(
      (user) => user.id === joinedTaskRow.tasks.ownerId,
    );

    if (!ownerUser) {
      throw new Error(
        "User owning task not found in Clerk. The user may have deleted their account.",
      );
    }

    if (joinedTaskRow.tasks.claimedBy !== null) {
      claimingUser = clerkUsers.data.find(
        (user) => user.id === joinedTaskRow.tasks.claimedBy,
      );

      if (!claimingUser) {
        throw new Error(
          "User claiming task not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (joinedTaskRow.tasks.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === joinedTaskRow.tasks.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User marking task as done not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    const parse = taskSchema.safeParse({
      taskId: joinedTaskRow.tasks.id,
      owner: userSchema.parse({
        id: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        id: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
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
      petName: joinedTaskRow.pets?.name ? joinedTaskRow.pets.name : null,
      groupId: joinedTaskRow.tasks.group,
      groupName: joinedTaskRow.groups?.name ? joinedTaskRow.groups.name : null,
      markedAsDone: joinedTaskRow.tasks.markedAsDoneBy !== null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            id: markedAsDoneUser?.id,
            name: markedAsDoneUser?.fullName,
            avatar: markedAsDoneUser?.imageUrl,
          })
        : null,
      claimed: joinedTaskRow.tasks.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            id: claimingUser?.id,
            name: claimingUser?.fullName,
            avatar: claimingUser?.imageUrl,
          })
        : null,
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
      ownerId: tasks.ownerId,
      createdBy: tasks.createdBy,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      pet: tasks.pet,
      petName: pets.name,
      group: tasks.group,
      groupName: groups.name,
      claimedBy: tasks.claimedBy,
      markedAsDoneBy: tasks.markedAsDoneBy,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(usersToGroups, eq(tasks.group, usersToGroups.groupId))
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .where(
      and(
        eq(usersToGroups.userId, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeTo, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
        not(eq(tasks.ownerId, user.userId)),
      ),
    );

  const tasksOwnedInRange = db
    .select({
      id: tasks.id,
      ownerId: tasks.ownerId,
      createdBy: tasks.createdBy,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      pet: tasks.pet,
      petName: pets.name,
      group: tasks.group,
      groupName: groups.name,
      claimedBy: tasks.claimedBy,
      markedAsDoneBy: tasks.markedAsDoneBy,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .where(
      and(
        eq(tasks.ownerId, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeFrom, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
      ),
    );

  const allTasksVisible = await union(groupInTasksInRange, tasksOwnedInRange);

  // For all tasks, if any of ownedBy, markedAsDoneBy, claimedBy are not null, fetch the user name for each
  // Then Turn into task schema
  const clerkUsers = await clerkClient.users.getUserList();
  const tasksList: Task[] = allTasksVisible.map((task) => {
    let claimingUser = null;
    let markedAsDoneUser = null;

    const createdByUser = clerkUsers.data.find(
      (user) => user.id === task.createdBy,
    );

    if (!createdByUser) {
      throw new Error(
        "User creating task not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

    if (!ownerUser) {
      throw new Error(
        "User owning task not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.claimedBy !== null) {
      claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

      if (!claimingUser) {
        throw new Error(
          "User claiming task not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User marking task as done not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    const parse = taskSchema.safeParse({
      taskId: task.id,
      owner: userSchema.parse({
        id: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        id: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
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
      petName: task.petName,
      groupId: task.group,
      groupName: task.groupName,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            id: markedAsDoneUser?.id,
            name: markedAsDoneUser?.fullName,
            avatar: markedAsDoneUser?.imageUrl,
          })
        : null,
      claimed: task.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            id: claimingUser?.id,
            name: claimingUser?.fullName,
            avatar: claimingUser?.imageUrl,
          })
        : null,
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
      ownerId: tasks.ownerId,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      pet: tasks.pet,
      petName: pets.name,
      group: tasks.group,
      groupName: groups.name,
      claimedBy: tasks.claimedBy,
      markedAsDoneBy: tasks.markedAsDoneBy,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .where(
      and(
        eq(usersToGroups.userId, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeTo, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
        not(eq(tasks.ownerId, user.userId)),
        isNull(tasks.claimedBy),
      ),
    );

  const tasksOwnedInRange = db
    .select({
      id: tasks.id,
      createdBy: tasks.createdBy,
      ownerId: tasks.ownerId,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      pet: tasks.pet,
      petName: pets.name,
      group: tasks.group,
      groupName: groups.name,
      claimedBy: tasks.claimedBy,
      markedAsDoneBy: tasks.markedAsDoneBy,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .where(
      and(
        eq(tasks.ownerId, user.userId),
        or(
          and(gte(tasks.dateRangeFrom, from), lte(tasks.dateRangeFrom, to)),
          and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)),
        ),
        isNull(tasks.claimedBy),
      ),
    );

  const allTasksVisible = await union(groupInTasksInRange, tasksOwnedInRange);

  // For all tasks, if any of ownedBy, markedAsDoneBy, claimedBy are not null, fetch the user name for each
  // Turn into task schema
  const clerkUsers = await clerkClient.users.getUserList();
  const tasksList: Task[] = allTasksVisible.map((task) => {
    let claimingUser = null;
    let markedAsDoneUser = null;

    const createdByUser = clerkUsers.data.find(
      (user) => user.id === task.createdBy,
    );

    if (!createdByUser) {
      throw new Error(
        "User creating task not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

    if (!ownerUser) {
      throw new Error(
        "User owning task not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.claimedBy !== null) {
      claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

      if (!claimingUser) {
        throw new Error(
          "User claiming task not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User marking task as done not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    const parse = taskSchema.safeParse({
      taskId: task.id,
      owner: userSchema.parse({
        id: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        id: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
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
      petName: task.petName,
      groupId: task.group,
      groupName: task.groupName,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            id: markedAsDoneUser?.id,
            name: markedAsDoneUser?.fullName,
            avatar: markedAsDoneUser?.imageUrl,
          })
        : null,
      claimed: task.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            id: claimingUser?.id,
            name: claimingUser?.fullName,
            avatar: claimingUser?.imageUrl,
          })
        : null,
    });

    if (!parse.success) {
      console.log(parse.error);
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}
