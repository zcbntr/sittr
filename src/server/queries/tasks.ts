"use server";

import { type Task, taskSchema, TaskTypeEnum } from "~/lib/schemas/tasks";
import { eq, and, or, lte, gte, inArray, not, isNull } from "drizzle-orm";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import { db } from "../db";
import {
  groups,
  petImages,
  pets,
  petsToGroups,
  tasks,
  usersToGroups,
} from "../db/schema";
import { union } from "drizzle-orm/pg-core";
import { userSchema } from "~/lib/schemas/users";
import { petSchema } from "~/lib/schemas/pets";
import { groupSchema } from "~/lib/schemas/groups";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function getAllOwnedTasks(): Promise<Task[]> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userTasks = await db.query.tasks.findMany({
    with: { group: true, pet: { with: { petImages: true } } },
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
        "User who created task was not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

    if (!ownerUser) {
      throw new Error(
        "User who owns task was not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.claimedBy !== null) {
      claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

      if (!claimingUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    return taskSchema.parse({
      taskId: task.id,
      owner: userSchema.parse({
        userId: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        userId: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
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
            petId: task.pet,
            name: task.pet.name,
            ownerId: task.pet.ownerId,
            createdBy: task.pet.createdBy,
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
            createdBy: task.group.createdBy,
          })
        : null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            userId: markedAsDoneUser.id,
            name: markedAsDoneUser.fullName,
            avatar: markedAsDoneUser.imageUrl,
          })
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimed: task.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            userId: claimingUser.id,
            name: claimingUser.fullName,
            avatar: claimingUser.imageUrl,
          })
        : null,
      claimedAt: task.claimedAt,
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
        "User who created task was not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find(
      (user) => user.id === task.tasks.ownerId,
    );

    if (!ownerUser) {
      throw new Error(
        "User who owns task was not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.tasks.claimedBy !== null) {
      claimingUser = clerkUsers.data.find(
        (user) => user.id === task.tasks.claimedBy,
      );

      if (!claimingUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.tasks.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.tasks.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    return taskSchema.parse({
      taskId: task.tasks.id,
      owner: userSchema.parse({
        userId: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        userId: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
      name: task.tasks.name,
      description: task.tasks.description,
      dueMode: task.tasks.dueMode,
      dueDate: task.tasks.dueMode ? task.tasks.dueDate : undefined,
      dateRange:
        !task.tasks.dueMode &&
        task.tasks.dateRangeFrom &&
        task.tasks.dateRangeTo
          ? {
              from: task.tasks.dateRangeFrom,
              to: task.tasks.dateRangeTo,
            }
          : undefined,
      pet: task.pets
        ? petSchema.parse({
            petId: task.pets.id,
            name: task.pets.name,
            ownerId: task.pets.ownerId,
            createdBy: task.pets.createdBy,
            species: task.pets.species,
            breed: task.pets.breed,
            dob: task.pets.dob,
            sex: task.pets?.sex,
            image: task.pets.image,
          })
        : null,
      group: task.groups
        ? groupSchema.parse({
            groupId: task.groups.id,
            name: task.groups.name,
            description: task.groups.description,
            createdBy: task.groups.createdBy,
          })
        : null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            userId: markedAsDoneUser.id,
            name: markedAsDoneUser.fullName,
            avatar: markedAsDoneUser.imageUrl,
          })
        : null,
      markedAsDoneAt: task.tasks.markedAsDoneAt,
      claimed: task.tasks.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            userId: claimingUser.id,
            name: claimingUser.fullName,
            avatar: claimingUser.imageUrl,
          })
        : null,
      claimedAt: task.tasks.claimedAt,
    });
  });
}

export async function getOwnedTaskById(taskId: string): Promise<Task> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const task = await db.query.tasks.findFirst({
    with: { group: true, pet: { with: { petImages: true } } },
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
      "User who created task was not found in Clerk. The user may have deleted their account.",
    );
  }

  const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

  if (!ownerUser) {
    throw new Error(
      "User who owns task was not found in Clerk. The user may have deleted their account.",
    );
  }

  if (task.claimedBy !== null) {
    claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

    if (!claimingUser) {
      throw new Error(
        "User who marked task as done was not found in Clerk. The user may have deleted their account.",
      );
    }
  }

  if (task.markedAsDoneBy !== null) {
    markedAsDoneUser = clerkUsers.data.find(
      (user) => user.id === task.markedAsDoneBy,
    );

    if (!markedAsDoneUser) {
      throw new Error(
        "User who marked task as done was not found in Clerk. The user may have deleted their account.",
      );
    }
  }

  // Turn into task schema
  return taskSchema.parse({
    taskId: task.id,
    owner: userSchema.parse({
      userId: ownerUser?.id,
      name: ownerUser?.fullName,
      avatar: ownerUser?.imageUrl,
    }),
    createdBy: userSchema.parse({
      userId: createdByUser?.id,
      name: createdByUser?.fullName,
      avatar: createdByUser?.imageUrl,
    }),
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
    pet: petSchema.parse({
      petId: task.pet,
      name: task.pet?.name,
      ownerId: task.pet?.ownerId,
      createdBy: task.pet?.createdBy,
      species: task.pet?.species,
      breed: task.pet?.breed,
      dob: task.pet?.dob,
      sex: task.pet?.sex,
      image: task.pet?.petImages ? task.pet.petImages.url : undefined,
    }),
    group: task.group
      ? groupSchema.parse({
          groupId: task.group.id,
          name: task.group.name,
          description: task.group.description,
          createdBy: task.group.createdBy,
        })
      : null,
    markedAsDoneBy: markedAsDoneUser
      ? userSchema.parse({
          userId: markedAsDoneUser.id,
          name: markedAsDoneUser.fullName,
          avatar: markedAsDoneUser.imageUrl,
        })
      : null,
    markedAsDoneAt: task.markedAsDoneAt,
    claimed: task.claimedBy !== null,
    claimedBy: claimingUser
      ? userSchema.parse({
          userId: claimingUser.id,
          name: claimingUser.fullName,
          avatar: claimingUser.imageUrl,
        })
      : null,
    claimedAt: task.claimedAt,
  });
}

export async function getVisibleTaskById(taskId: string): Promise<Task> {
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Get tasks in range where the user is in the group the task is assigned to
  const groupInTasksInRange = db
    .select({
      taskId: tasks.id,
      ownerId: tasks.ownerId,
      createdBy: tasks.createdBy,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      petId: pets.id,
      petName: pets.name,
      petCreatedBy: pets.createdBy,
      petOwnerId: pets.ownerId,
      petSpecies: pets.species,
      petBreed: pets.breed,
      petDob: pets.dob,
      petSex: pets.sex,
      petImage: petImages.url,
      groupId: groups.id,
      groupName: groups.name,
      groupDescription: groups.description,
      groupCreatedBy: groups.createdBy,
      claimedBy: tasks.claimedBy,
      claimedAt: tasks.claimedAt,
      markedAsDoneBy: tasks.markedAsDoneBy,
      markedAsDoneAt: tasks.markedAsDoneAt,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(usersToGroups, eq(tasks.group, usersToGroups.groupId))
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .leftJoin(petImages, eq(pets.id, petImages.petId))
    .where(
      and(
        eq(usersToGroups.userId, user.userId),
        eq(tasks.id, taskId),
        not(eq(tasks.ownerId, user.userId)),
      ),
    );

  const tasksOwnedInRange = db
    .select({
      taskId: tasks.id,
      ownerId: tasks.ownerId,
      createdBy: tasks.createdBy,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      petId: pets.id,
      petName: pets.name,
      petCreatedBy: pets.createdBy,
      petOwnerId: pets.ownerId,
      petSpecies: pets.species,
      petBreed: pets.breed,
      petDob: pets.dob,
      petSex: pets.sex,
      petImage: petImages.url,
      groupId: groups.id,
      groupName: groups.name,
      groupDescription: groups.description,
      groupCreatedBy: groups.createdBy,
      claimedBy: tasks.claimedBy,
      claimedAt: tasks.claimedAt,
      markedAsDoneBy: tasks.markedAsDoneBy,
      markedAsDoneAt: tasks.markedAsDoneAt,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .leftJoin(petImages, eq(pets.id, petImages.petId))
    .where(and(eq(tasks.ownerId, user.userId), eq(tasks.id, taskId)));

  const allTasksVisible = await union(groupInTasksInRange, tasksOwnedInRange);

  if (allTasksVisible.length === 0 || !allTasksVisible?.[0]) {
    throw new Error("Task not found");
  }

  const task = allTasksVisible[0];

  const clerkUsers = await clerkClient.users.getUserList();

  let claimingUser = null;
  let markedAsDoneUser = null;

  const createdByUser = clerkUsers.data.find(
    (user) => user.id === task.createdBy,
  );

  if (!createdByUser) {
    throw new Error(
      "User who created task was not found in Clerk. The user may have deleted their account.",
    );
  }

  const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

  if (!ownerUser) {
    throw new Error(
      "User who owns task was not found in Clerk. The user may have deleted their account.",
    );
  }

  if (task.claimedBy !== null) {
    claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

    if (!claimingUser) {
      throw new Error(
        "User who claimed task was not found in Clerk. The user may have deleted their account.",
      );
    }
  }

  if (task.markedAsDoneBy !== null) {
    markedAsDoneUser = clerkUsers.data.find(
      (user) => user.id === task.markedAsDoneBy,
    );

    if (!markedAsDoneUser) {
      throw new Error(
        "User who marked task as done was not found in Clerk. The user may have deleted their account.",
      );
    }
  }

  const parse = taskSchema.safeParse({
    taskId: task.taskId,
    owner: userSchema.parse({
      userId: ownerUser?.id,
      name: ownerUser?.fullName,
      avatar: ownerUser?.imageUrl,
    }),
    createdBy: userSchema.parse({
      userId: createdByUser?.id,
      name: createdByUser?.fullName,
      avatar: createdByUser?.imageUrl,
    }),
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
    pet: task.petId
      ? petSchema.parse({
          petId: task.petId,
          ownerId: task.petOwnerId,
          createdBy: task.petCreatedBy,
          name: task.petName,
          species: task.petSpecies,
          breed: task.petBreed,
          dob: task.petDob,
          sex: task.petSex,
          image: task.petImage,
        })
      : null,
    group: task.groupId
      ? groupSchema.parse({
          groupId: task.groupId,
          name: task.groupName,
          description: task.groupDescription,
          createdBy: task.groupCreatedBy,
        })
      : null,
    markedAsDoneBy: markedAsDoneUser
      ? userSchema.parse({
          userId: markedAsDoneUser.id,
          name: markedAsDoneUser.fullName,
          avatar: markedAsDoneUser.imageUrl,
        })
      : null,
    markedAsDoneAt: task.markedAsDoneAt,
    claimed: task.claimedBy !== null,
    claimedBy: claimingUser
      ? userSchema.parse({
          userId: claimingUser.id,
          name: claimingUser.fullName,
          avatar: claimingUser.imageUrl,
        })
      : null,
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
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const tasksInRange = await db.query.tasks.findMany({
    with: { group: true, pet: { with: { petImages: true } } },
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
        "User who created task was not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

    if (!ownerUser) {
      throw new Error(
        "User who owns task was not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.claimedBy !== null) {
      claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

      if (!claimingUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    return taskSchema.parse({
      taskId: task.id,
      owner: userSchema.parse({
        userId: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        userId: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
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
            petId: task.pet.id,
            name: task.pet.name,
            ownerId: task.pet.ownerId,
            createdBy: task.pet.createdBy,
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
            createdBy: task.group.createdBy,
          })
        : null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            userId: markedAsDoneUser.id,
            name: markedAsDoneUser.fullName,
            avatar: markedAsDoneUser.imageUrl,
          })
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimed: task.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            userId: claimingUser.id,
            name: claimingUser.fullName,
            avatar: claimingUser.imageUrl,
          })
        : null,
      claimedAt: task.claimedAt,
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
    .leftJoin(petImages, eq(pets.id, petImages.petId))
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
        "User who created task was not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find(
      (user) => user.id === joinedTaskRow.tasks.ownerId,
    );

    if (!ownerUser) {
      throw new Error(
        "User who owns task was not found in Clerk. The user may have deleted their account.",
      );
    }

    if (joinedTaskRow.tasks.claimedBy !== null) {
      claimingUser = clerkUsers.data.find(
        (user) => user.id === joinedTaskRow.tasks.claimedBy,
      );

      if (!claimingUser) {
        throw new Error(
          "User who claimed task not was found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (joinedTaskRow.tasks.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === joinedTaskRow.tasks.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    const parse = taskSchema.safeParse({
      taskId: joinedTaskRow.tasks.id,
      owner: userSchema.parse({
        userId: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        userId: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
      name: joinedTaskRow.tasks.name,
      description: joinedTaskRow.tasks.description,
      dueMode: joinedTaskRow.tasks.dueMode,
      dueDate: joinedTaskRow.tasks.dueMode
        ? joinedTaskRow.tasks.dueDate
        : undefined,
      dateRange:
        !joinedTaskRow.tasks.dueMode &&
        joinedTaskRow.tasks.dateRangeFrom &&
        joinedTaskRow.tasks.dateRangeTo
          ? {
              from: joinedTaskRow.tasks.dateRangeFrom,
              to: joinedTaskRow.tasks.dateRangeTo,
            }
          : undefined,
      pet: joinedTaskRow.pets
        ? petSchema.parse({
            petId: joinedTaskRow.pets.id,
            ownerId: joinedTaskRow.pets.ownerId,
            createdBy: joinedTaskRow.pets.createdBy,
            name: joinedTaskRow.pets.name,
            species: joinedTaskRow.pets.species,
            breed: joinedTaskRow.pets.breed,
            dob: joinedTaskRow.pets.dob,
            sex: joinedTaskRow.pets.sex,
            image: joinedTaskRow.pet_images
              ? joinedTaskRow.pet_images.url
              : undefined,
          })
        : null,
      group: joinedTaskRow.groups
        ? groupSchema.parse({
            groupId: joinedTaskRow.groups.id,
            name: joinedTaskRow.groups.name,
            description: joinedTaskRow.groups.description,
            createdBy: joinedTaskRow.groups.createdBy,
          })
        : null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            userId: markedAsDoneUser.id,
            name: markedAsDoneUser.fullName,
            avatar: markedAsDoneUser.imageUrl,
          })
        : null,
      markedAsDoneAt: joinedTaskRow.tasks.markedAsDoneAt,
      claimed: joinedTaskRow.tasks.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            userId: claimingUser.id,
            name: claimingUser.fullName,
            avatar: claimingUser.imageUrl,
          })
        : null,
      claimedAt: joinedTaskRow.tasks.claimedAt,
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
      taskId: tasks.id,
      ownerId: tasks.ownerId,
      createdBy: tasks.createdBy,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      petId: pets.id,
      petName: pets.name,
      petCreatedBy: pets.createdBy,
      petOwnerId: pets.ownerId,
      petSpecies: pets.species,
      petBreed: pets.breed,
      petDob: pets.dob,
      petSex: pets.sex,
      petImage: petImages.url,
      groupId: groups.id,
      groupName: groups.name,
      groupDescription: groups.description,
      groupCreatedBy: groups.createdBy,
      claimedBy: tasks.claimedBy,
      claimedAt: tasks.claimedAt,
      markedAsDoneBy: tasks.markedAsDoneBy,
      markedAsDoneAt: tasks.markedAsDoneAt,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(usersToGroups, eq(tasks.group, usersToGroups.groupId))
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .leftJoin(petImages, eq(pets.id, petImages.petId))
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
      taskId: tasks.id,
      ownerId: tasks.ownerId,
      createdBy: tasks.createdBy,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      petId: pets.id,
      petName: pets.name,
      petCreatedBy: pets.createdBy,
      petOwnerId: pets.ownerId,
      petSpecies: pets.species,
      petBreed: pets.breed,
      petDob: pets.dob,
      petSex: pets.sex,
      petImage: petImages.url,
      groupId: groups.id,
      groupName: groups.name,
      groupDescription: groups.description,
      groupCreatedBy: groups.createdBy,
      claimedBy: tasks.claimedBy,
      claimedAt: tasks.claimedAt,
      markedAsDoneBy: tasks.markedAsDoneBy,
      markedAsDoneAt: tasks.markedAsDoneAt,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .leftJoin(petImages, eq(pets.id, petImages.petId))
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
        "User who created task was not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

    if (!ownerUser) {
      throw new Error(
        "User who owns task was not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.claimedBy !== null) {
      claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

      if (!claimingUser) {
        throw new Error(
          "User who claimed task was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    const parse = taskSchema.safeParse({
      taskId: task.taskId,
      owner: userSchema.parse({
        userId: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        userId: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
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
      pet: task.petId
        ? petSchema.parse({
            petId: task.petId,
            ownerId: task.petOwnerId,
            createdBy: task.petCreatedBy,
            name: task.petName,
            species: task.petSpecies,
            breed: task.petBreed,
            dob: task.petDob,
            sex: task.petSex,
            image: task.petImage,
          })
        : null,
      group: task.groupId
        ? groupSchema.parse({
            groupId: task.groupId,
            name: task.groupName,
            description: task.groupDescription,
            createdBy: task.groupCreatedBy,
          })
        : null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            userId: markedAsDoneUser.id,
            name: markedAsDoneUser.fullName,
            avatar: markedAsDoneUser.imageUrl,
          })
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimed: task.claimedBy !== null,
      claimedBy: claimingUser
        ? userSchema.parse({
            userId: claimingUser.id,
            name: claimingUser.fullName,
            avatar: claimingUser.imageUrl,
          })
        : null,
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
  const user = await auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Get tasks in range where the user is in the group the task is assigned to
  const groupInTasksInRange = db
    .select({
      taskId: tasks.id,
      createdBy: tasks.createdBy,
      ownerId: tasks.ownerId,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      petId: pets.id,
      petName: pets.name,
      petCreatedBy: pets.createdBy,
      petOwnerId: pets.ownerId,
      petSpecies: pets.species,
      petBreed: pets.breed,
      petDob: pets.dob,
      petSex: pets.sex,
      petImage: petImages.url,
      groupId: groups.id,
      groupName: groups.name,
      groupDescription: groups.description,
      groupCreatedBy: groups.createdBy,
      claimedBy: tasks.claimedBy,
      claimedAt: tasks.claimedAt,
      markedAsDoneBy: tasks.markedAsDoneBy,
      markedAsDoneAt: tasks.markedAsDoneAt,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .leftJoin(petImages, eq(pets.id, petImages.petId))
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
      taskId: tasks.id,
      createdBy: tasks.createdBy,
      ownerId: tasks.ownerId,
      name: tasks.name,
      description: tasks.description,
      completed: tasks.completed,
      dueMode: tasks.dueMode,
      dueDate: tasks.dueDate,
      dateRangeFrom: tasks.dateRangeFrom,
      dateRangeTo: tasks.dateRangeTo,
      petId: pets.id,
      petName: pets.name,
      petCreatedBy: pets.createdBy,
      petOwnerId: pets.ownerId,
      petSpecies: pets.species,
      petBreed: pets.breed,
      petDob: pets.dob,
      petSex: pets.sex,
      petImage: petImages.url,
      groupId: groups.id,
      groupName: groups.name,
      groupDescription: groups.description,
      groupCreatedBy: groups.createdBy,
      claimedBy: tasks.claimedBy,
      claimedAt: tasks.claimedAt,
      markedAsDoneBy: tasks.markedAsDoneBy,
      markedAsDoneAt: tasks.markedAsDoneAt,
      requiresVerification: tasks.requiresVerification,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(groups, eq(tasks.group, groups.id))
    .leftJoin(petsToGroups, eq(groups.id, petsToGroups.groupId))
    .leftJoin(pets, eq(tasks.pet, pets.id))
    .leftJoin(petImages, eq(pets.id, petImages.petId))
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
        "User who created task was not found in Clerk. The user may have deleted their account.",
      );
    }

    const ownerUser = clerkUsers.data.find((user) => user.id === task.ownerId);

    if (!ownerUser) {
      throw new Error(
        "User who owns task was not found in Clerk. The user may have deleted their account.",
      );
    }

    if (task.claimedBy !== null) {
      claimingUser = clerkUsers.data.find((user) => user.id === task.claimedBy);

      if (!claimingUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    if (task.markedAsDoneBy !== null) {
      markedAsDoneUser = clerkUsers.data.find(
        (user) => user.id === task.markedAsDoneBy,
      );

      if (!markedAsDoneUser) {
        throw new Error(
          "User who marked task as done was not found in Clerk. The user may have deleted their account.",
        );
      }
    }

    const parse = taskSchema.safeParse({
      taskId: task.taskId,
      owner: userSchema.parse({
        userId: ownerUser?.id,
        name: ownerUser?.fullName,
        avatar: ownerUser?.imageUrl,
      }),
      createdBy: userSchema.parse({
        userId: createdByUser?.id,
        name: createdByUser?.fullName,
        avatar: createdByUser?.imageUrl,
      }),
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
      pet: task.petId
        ? petSchema.parse({
            petId: task.petId,
            ownerId: task.petOwnerId,
            createdBy: task.petCreatedBy,
            name: task.petName,
            species: task.petSpecies,
            breed: task.petBreed,
            dob: task.petDob,
            sex: task.petSex,
            image: task.petImage,
          })
        : null,
      group: task.groupId
        ? groupSchema.parse({
            groupId: task.groupId,
            name: task.groupName,
            description: task.groupDescription,
            createdBy: task.groupCreatedBy,
          })
        : null,
      markedAsDoneBy: markedAsDoneUser
        ? userSchema.parse({
            userId: markedAsDoneUser.id,
            name: markedAsDoneUser.fullName,
            avatar: markedAsDoneUser.imageUrl,
          })
        : null,
      markedAsDoneAt: task.markedAsDoneAt,
      claimedBy: claimingUser
        ? userSchema.parse({
            userId: claimingUser.id,
            name: claimingUser.fullName,
            avatar: claimingUser.imageUrl,
          })
        : null,
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
