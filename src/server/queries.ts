"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, and, or, lte, gte, inArray } from "drizzle-orm";
import {
  groupInviteCodes,
  groupMembers,
  groups,
  pets,
  tasks,
  petsToGroups,
} from "./db/schema";
import {
  type CreateGroupFormInput,
  type CreatePetFormInput,
  type CreateTask,
  type Group,
  type GroupInviteCode,
  groupInviteCodeSchema,
  type GroupMember,
  groupMemberSchema,
  GroupRoleEnum,
  groupSchema,
  type Pet,
  petSchema,
  type RequestGroupInviteCodeFormInput,
  RoleEnum,
  type Task,
  taskSchema,
} from "~/lib/schema";
import { group } from "console";

export async function getOwnedTasksStartingInRange(
  from: Date,
  to: Date,
): Promise<Task[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
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
    try {
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
    } catch (error) {
      console.error("Failed to parse task", error);
      throw new Error("Failed to parse task");
    }
  });

  return tasksList;
}

export async function getOwnedTasks(): Promise<Task[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
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

export async function getOwnedTask(taskId: string): Promise<Task> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const task = await db.query.tasks.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.id, taskId), eq(model.ownerId, user.userId)),
  });

  if (!task) {
    throw new Error("Task not found");
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
): Promise<Task[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Get tasks in range where the user is the owner or in the group the task is assigned to
  const visibleTasksInRange = await db
    .select()
    .from(tasks)
    .leftJoin(groups, eq(tasks.pet, groups.id))
    .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(
      and(
        or(
          eq(groupMembers.userId, user.userId),
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
      console.error("Failed to parse task", parse.error);
      throw new Error("Failed to parse task");
    }

    return parse.data;
  });

  return tasksList;
}

export async function createTask(task: CreateTask): Promise<Task> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
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

export async function updateTask(task: Task): Promise<Task> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
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
    throw new Error("Task not found");
  }

  // Check if the task has been marked as done
  // If so, update the markedAsDoneBy field, if the user is the owner or the task is unmarked, or the user is the one who marked it
  if (
    updatedTask[0].markedAsDoneBy != user.userId &&
    (user.userId == updatedTask[0].ownerId ||
      updatedTask[0].markedAsDoneBy == null ||
      user.userId == updatedTask[0].markedAsDoneBy)
  ) {
    console.log("Updating markedAsDoneBy");
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

export async function deleteOwnedTask(id: string): Promise<Task> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
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

export async function getGroupById(id: string): Promise<Group | null> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const group = await db.query.groups.findFirst({
    where: (model, { eq }) => eq(model.id, id),
    with: {
      groupMembers: true,
    },
  });

  if (!group) {
    return null;
  }

  return groupSchema.parse({
    id: group.id,
    name: group.name,
    description: group.description,
    members: group.groupMembers.map((member) => {
      return {
        id: member.userId,
        groupId: member.groupId,
        role: member.role,
        userId: member.userId,
      };
    }),
  });
}

export async function getGroupsByIds(ids: string[]): Promise<Group[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const groupsList = await db
    .select()
    .from(groups)
    .where(inArray(groups.id, ids));

  if (!groupsList) {
    throw new Error("Failed to get groups by ids");
  }

  return groupsList.map((group) => {
    return groupSchema.parse({
      id: group.id,
      name: group.name,
      description: group.description,
    });
  });
}

export async function getPetsOfGroup(groupId: string): Promise<Pet[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const petsList = await db
    .select()
    .from(pets)
    .leftJoin(petsToGroups, eq(petsToGroups.petId, pets.id))
    .where(eq(petsToGroups.groupId, groupId));

  if (!petsList) {
    throw new Error("Failed to get pets of group");
  }

  return petsList.map((pet) => {
    return petSchema.parse({
      id: pet.pets.id,
      ownerId: pet.pets.ownerId,
      name: pet.pets.name,
      species: pet.pets.species,
      breed: pet.pets.breed,
      dob: pet.pets.dob,
    });
  });
}

export async function createGroup(group: CreateGroupFormInput): Promise<Group> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Create group, add user to groupMembers, add subjects to subjects, all in a transaction
  const groupToReturn = await db.transaction(async (db) => {
    // Create group
    const newGroup = await db
      .insert(groups)
      .values({
        name: group.name,
        description: group.description,
      })
      .returning()
      .execute();

    if (!newGroup?.[0]) {
      db.rollback();
      throw new Error("Failed to create group");
    }

    // Add current user to groupMembers table
    const groupMember = await db
      .insert(groupMembers)
      .values({
        groupId: newGroup[0].id,
        userId: user.userId,
        role: RoleEnum.Values.Owner,
      })
      .returning()
      .execute();

    if (!groupMember?.[0]) {
      db.rollback();
      throw new Error("Failed to add user to group");
    }

    // Add sitting subjects to group
    for (const petId of group.petIds) {
      const subject = await db
        .insert(petsToGroups)
        .values({
          groupId: newGroup[0].id,
          petId: petId,
        })
        .returning()
        .execute();

      if (!subject?.[0]) {
        db.rollback();
        throw new Error("Failed to add subject to group");
      }
    }

    return groupSchema.parse({
      id: newGroup[0].id,
      name: newGroup[0].name,
      description: newGroup[0].description,
      members: [
        groupMemberSchema.parse({
          id: groupMember[0].id,
          groupId: groupMember[0].groupId,
          userId: groupMember[0].userId,
          role: groupMember[0].role,
        }),
      ],
      petIds: group.petIds,
    });
  });

  if (groupToReturn) return groupToReturn;

  throw new Error("Failed to create group");
}

export async function getNewGroupInviteCode(
  request: RequestGroupInviteCodeFormInput,
): Promise<GroupInviteCode> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Check user is the owner of the group
  const groupMember = await db.query.groupMembers.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, request.groupId),
        eq(model.userId, user.userId),
        eq(model.role, RoleEnum.Values.Owner),
      ),
  });

  if (groupMember) {
    throw new Error(
      "User is not the owner of the group, not a member, or the group doesn't exist",
    );
  }

  // Create a new invite code based on the group id and random number
  function getRandomUint32() {
    const data = new Uint32Array(1);
    crypto.getRandomValues(data);
    return data[0];
  }

  const inviteCode = getRandomUint32()?.toString(16);

  if (!inviteCode) {
    throw new Error("Failed to generate invite code");
  }

  const newInviteCode = await db
    .insert(groupInviteCodes)
    .values({
      groupId: request.groupId,
      code: inviteCode,
      maxUses: request.maxUses,
      expiresAt: request.expiresAt,
      requiresApproval: request.requiresApproval,
    })
    .returning()
    .execute();

  if (!newInviteCode?.[0]) {
    throw new Error("Failed to create invite code");
  }

  return groupInviteCodeSchema.parse({
    id: newInviteCode[0].id,
    groupId: newInviteCode[0].groupId,
    code: newInviteCode[0].code,
    maxUses: newInviteCode[0].maxUses,
    uses: newInviteCode[0].uses,
    expiresAt: newInviteCode[0].expiresAt,
    requiresApproval: newInviteCode[0].requiresApproval,
  });
}

export async function joinGroup(inviteCode: string): Promise<GroupMember> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // This needs to be a find many if there becomes lots of groups
  const inviteCodeRow = await db.query.groupInviteCodes.findFirst({
    where: (model, { eq }) => eq(model.code, inviteCode),
  });

  if (!inviteCodeRow) {
    throw new Error("Invite code not found");
  }

  // Check if the invite code has expired
  if (inviteCodeRow.expiresAt < new Date()) {
    // Delete code
    await db
      .delete(groupInviteCodes)
      .where(eq(groupInviteCodes.id, inviteCodeRow.id))
      .execute();

    throw new Error("Invite code has expired");
  }

  // Check if the invite code has reached its max uses
  if (inviteCodeRow.uses >= inviteCodeRow.maxUses) {
    // Delete code
    await db
      .delete(groupInviteCodes)
      .where(eq(groupInviteCodes.id, inviteCodeRow.id))
      .execute();

    throw new Error("Invite code has reached its max uses");
  }

  // Check if the user is already in the group
  const existingGroupRow = await db.query.groupMembers.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, inviteCodeRow.groupId),
        eq(model.userId, user.userId),
      ),
  });

  if (existingGroupRow) {
    throw new Error("User is already in the group");
  }

  // Add the user to the group
  const newGroupMember = await db
    .insert(groupMembers)
    .values({
      groupId: inviteCodeRow.groupId,
      userId: user.userId,
      role: inviteCodeRow.requiresApproval
        ? GroupRoleEnum.Values.Pending
        : GroupRoleEnum.Values.Member,
    })
    .returning()
    .execute();

  if (!newGroupMember?.[0]) {
    throw new Error("Failed to add user to group");
  }

  // Check if incrementing the invite code will cause it to reach its max uses
  if (inviteCodeRow.uses + 1 >= inviteCodeRow.maxUses) {
    // Delete code
    await db
      .delete(groupInviteCodes)
      .where(eq(groupInviteCodes.id, inviteCodeRow.id))
      .execute();
  } else {
    // Increment the invite code uses
    await db
      .update(groupInviteCodes)
      .set({ uses: inviteCodeRow.uses + 1 })
      .where(eq(groupInviteCodes.id, inviteCodeRow.id))
      .execute();
  }

  return groupMemberSchema.parse({
    groupId: newGroupMember[0].groupId,
    userId: newGroupMember[0].userId,
    role: newGroupMember[0].role,
  });
}

export async function leaveGroup(groupId: string): Promise<GroupMember> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const groupMember = await db.query.groupMembers.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.groupId, groupId), eq(model.userId, user.userId)),
  });

  if (!groupMember) {
    throw new Error("User is not in the group");
  }

  const deletedGroupMember = await db
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, user.userId),
        eq(groupMembers.groupId, groupId),
      ),
    )
    .returning();

  if (!deletedGroupMember[0]) {
    throw new Error("Failed to delete group member");
  }

  return groupMemberSchema.parse({
    groupId: deletedGroupMember[0].groupId,
    userId: deletedGroupMember[0].userId,
    role: deletedGroupMember[0].role,
  });
}

export async function getGroupMembers(groupId: string) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const groupMembersList = await db.query.groupMembers.findMany({
    where: (model, { eq }) => eq(model.groupId, groupId),
  });

  return groupMembersList;
}

export async function updateGroup(group: Group) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Check user is the owner of the group
  const groupMember = await db.query.groupMembers.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, group.id),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (!groupMember) {
    throw new Error("User is not the owner of the group");
  }

  const updatedGroup = await db
    .update(groups)
    .set({
      name: group.name,
      description: group.description,
    })
    .where(eq(groups.id, group.id))
    .returning()
    .execute();

  if (!updatedGroup?.[0]) {
    throw new Error("Failed to update group");
  }

  return groupSchema.parse({
    id: updatedGroup[0].id,
    name: updatedGroup[0].name,
    description: updatedGroup[0].description,
  });
}

export async function deleteGroup(groupId: string): Promise<Group> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Check user is the owner of the group
  const groupMember = await db.query.groupMembers.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (!groupMember) {
    throw new Error("User is not the owner of the group");
  }

  const deletedGroup = await db
    .delete(groups)
    .where(eq(groups.id, groupId))
    .returning();

  if (!deletedGroup[0]) {
    throw new Error("Failed to delete group");
  }

  // Database cascade should delete groupMembers and subjectsToGroups, fingers crossed!

  return groupSchema.parse({
    id: deletedGroup[0].id,
    name: deletedGroup[0].name,
    description: deletedGroup[0].description,
  });
}

export async function getGroupsUserIsIn(): Promise<Group[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const groupMemberList = await db.query.groupMembers.findMany({
    where: (model, { eq }) => eq(model.userId, user.userId),
    with: {
      group: {
        with: {
          groupMembers: true,
        },
      },
    },
  });

  if (!groupMemberList) {
    throw new Error("Failed to get groups user is in");
  }

  return groupMemberList.map((groupMember) => {
    return groupSchema.parse({
      id: groupMember.groupId,
      name: groupMember.group.name,
      description: groupMember.group.description,
      members: groupMember.group.groupMembers.map((member) => {
        return {
          id: member.userId,
          groupId: member.groupId,
          role: member.role,
          userId: member.userId,
        };
      }),
    });
  });
}

export async function createPet(pet: CreatePetFormInput): Promise<Pet> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const newPet = await db
    .insert(pets)
    .values({
      ownerId: user.userId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      dob: pet.dob,
    })
    .returning();

  if (!newPet?.[0]) {
    throw new Error("Failed to create pet");
  }

  return petSchema.parse({
    id: newPet[0].id,
    ownerId: newPet[0].ownerId,
    name: newPet[0].name,
    species: newPet[0].species,
    breed: newPet[0].breed ? pet.breed : undefined,
    dob: newPet[0].dob,
  });
}

export async function getPetById(petId: string): Promise<Pet> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const pet = await db.query.pets.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.id, petId), eq(model.ownerId, user.userId)),
  });

  if (!pet) {
    throw new Error("Pet not found");
  }

  return petSchema.parse({
    id: pet.id,
    ownerId: pet.ownerId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed ? pet.breed : undefined,
    dob: pet.dob,
  });
}

export async function getOwnedPets(): Promise<Pet[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const ownedPets = await db.query.pets.findMany({
    where: (model, { eq }) => eq(model.ownerId, user.userId),
  });

  // Turn into zod pet type
  const petsList: Pet[] = ownedPets.map((pet) => {
    return petSchema.parse({
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed ? pet.breed : undefined,
      dob: pet.dob,
    });
  });

  return petsList;
}

export async function updatePet(pet: Pet): Promise<Pet> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const updatedPet = await db
    .update(pets)
    .set({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      dob: pet.dob,
    })
    .where(eq(pets.id, pet.id))
    .returning()
    .execute();

  if (!updatedPet?.[0]) {
    throw new Error("Failed to update pet");
  }

  return petSchema.parse({
    id: updatedPet[0].id,
    ownerId: updatedPet[0].ownerId,
    name: updatedPet[0].name,
    species: updatedPet[0].species,
    breed: updatedPet[0].breed ? updatedPet[0].breed : undefined,
    dob: updatedPet[0].dob,
  });
}

export async function deletePet(petId: string): Promise<Pet> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const petToReturn = await db.transaction(async (db) => {
    const deletedPet = await db
      .delete(pets)
      .where(eq(pets.id, petId))
      .returning();

    if (!deletedPet?.[0]) {
      db.rollback();
      throw new Error("Failed to delete pet from pet table");
    }

    return petSchema.parse({
      id: deletedPet[0].id,
      ownerId: deletedPet[0].ownerId,
      name: deletedPet[0].name,
      species: deletedPet[0].species,
      breed: deletedPet[0].breed ? deletedPet[0].breed : undefined,
      dob: deletedPet[0].dob,
    });
  });

  if (petToReturn) return petToReturn;

  throw new Error("Failed to delete pet");
}
