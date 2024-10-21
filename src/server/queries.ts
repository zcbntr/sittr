"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, and, or, lte, gte } from "drizzle-orm";
import {
  groupInviteCodes,
  groupMembers,
  groups,
  houses,
  pets,
  plants,
  sittingSubjects,
  subjectsToGroups,
  tasks,
  userSittingPreferences,
  userOwnerPreferences,
} from "./db/schema";
import {
  type CreateGroupFormInput,
  type CreateHouseFormInput,
  type CreatePetFormInput,
  type CreatePlantFormInput,
  type CreateTask,
  type Group,
  type GroupInviteCode,
  groupInviteCodeSchema,
  type GroupMember,
  groupMemberSchema,
  GroupRoleEnum,
  groupSchema,
  type House,
  houseSchema,
  type Pet,
  petSchema,
  type Plant,
  plantSchema,
  type RequestGroupInviteCodeFormInput,
  RoleEnum,
  type SittingSubject,
  type Task,
  taskSchema,
  type UserPreferences,
  userPreferencesSchema,
} from "~/lib/schema";

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
        subjectId: task.sittingSubject,
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
      subjectId: task.sittingSubject,
      groupId: task.group,
      markedAsDone: task.markedAsDoneBy !== null,
      markedAsDoneBy: task.markedAsDoneBy,
    });
  });

  return tasksList;
}

export async function getOwnedTask(taskId: number): Promise<Task> {
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
    subjectId: task.sittingSubject,
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
    .leftJoin(groups, eq(tasks.sittingSubject, groups.id))
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
      subjectId: joinedTaskRow.tasks.sittingSubject,
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
      sittingSubject: task.subjectId,
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
      subjectId: newTask[0].sittingSubject,
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
      sittingSubject: task.subjectId,
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
        subjectId: updatedTaskChangedMarkedAsDoneBy[0].sittingSubject,
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
    subjectId: updatedTask[0].sittingSubject,
    groupId: updatedTask[0].group,
    markedAsDone: updatedTask[0].markedAsDoneBy !== null,
    markedAsDoneBy: updatedTask[0].markedAsDoneBy,
  });
}

export async function deleteOwnedTask(id: number): Promise<Task> {
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
      subjectId: deletedTask[0].sittingSubject,
      groupId: deletedTask[0].group,
      markedAsDone: deletedTask[0].markedAsDoneBy !== null,
      markedAsDoneBy: deletedTask[0].markedAsDoneBy,
    });
  }

  throw new Error("Failed to delete task");
}

export async function currentUserCompletedOnboarding(): Promise<boolean> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const userPreferances = await getCurrentUserPreferences();
  if (userPreferances) return true;

  return false;
}

export async function getCurrentUserPreferences(): Promise<
  UserPreferences | undefined
> {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const preferences = await db
    .select()
    .from(userOwnerPreferences)
    .where(eq(userOwnerPreferences.userId, userId))
    .innerJoin(
      userSittingPreferences,
      eq(userOwnerPreferences.userId, userSittingPreferences.userId),
    )
    .execute();

  if (preferences?.[0]) {
    const parseResult = userPreferencesSchema.safeParse({
      userId: preferences?.[0].user_owner_preferences.userId,
      wantPetSitting: preferences?.[0].user_owner_preferences.petSitting,
      wantHouseSitting: preferences?.[0].user_owner_preferences.houseSitting,
      wantBabySitting: preferences?.[0].user_owner_preferences.babySitting,
      wantPlantSitting: preferences?.[0].user_owner_preferences.plantSitting,
      sitForPets: preferences?.[0].user_sitting_preferences.petSitting,
      sitForHouses: preferences?.[0].user_sitting_preferences.houseSitting,
      sitForBabies: preferences?.[0].user_sitting_preferences.babySitting,
      sitForPlants: preferences?.[0].user_sitting_preferences.plantSitting,
    });

    if (parseResult.success) {
      return parseResult.data;
    } else {
      throw new Error("Zod schema error: " + parseResult.error.toString());
    }
  }
}

export async function setUserPreferences(
  preferences: UserPreferences,
): Promise<UserPreferences> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  if (preferences.userId !== user.userId && preferences.userId !== undefined) {
    throw new Error("User ID does not match");
  }

  // First check if the user already has preferences set
  const existingUserPreferences = await getCurrentUserPreferences();

  // If the user already has preferences set, update them
  if (existingUserPreferences) {
    const updatedUserPreferences = await db.transaction(async (db) => {
      const updatedUserOwnerPreferences = await db
        .update(userOwnerPreferences)
        .set({
          petSitting: preferences.wantPetSitting,
          houseSitting: preferences.wantHouseSitting,
          babySitting: preferences.wantBabySitting,
          plantSitting: preferences.wantPlantSitting,
        })
        .where(eq(userOwnerPreferences.userId, user.userId))
        .returning()
        .execute();

      if (!updatedUserOwnerPreferences?.[0]) {
        db.rollback();
        throw new Error("Failed to update user owner preferences");
      }

      const updatedUserSitterPreferences = await db
        .update(userSittingPreferences)
        .set({
          petSitting: preferences.sitForPets,
          houseSitting: preferences.sitForHouses,
          babySitting: preferences.sitForBabies,
          plantSitting: preferences.sitForPlants,
        })
        .where(eq(userSittingPreferences.userId, user.userId))
        .returning()
        .execute();

      if (!updatedUserSitterPreferences?.[0]) {
        db.rollback();
        throw new Error("Failed to update user sitter preferences");
      }

      return userPreferencesSchema.parse({
        userId: updatedUserOwnerPreferences[0].userId,
        wantPetSitting: updatedUserOwnerPreferences[0].petSitting,
        wantHouseSitting: updatedUserOwnerPreferences[0].houseSitting,
        wantBabySitting: updatedUserOwnerPreferences[0].babySitting,
        wantPlantSitting: updatedUserOwnerPreferences[0].plantSitting,
        sitForPets: updatedUserSitterPreferences[0].petSitting,
        sitForHouses: updatedUserSitterPreferences[0].houseSitting,
        sitForBabies: updatedUserSitterPreferences[0].babySitting,
        sitForPlants: updatedUserSitterPreferences[0].plantSitting,
      });
    });

    if (updatedUserPreferences) return updatedUserPreferences;
  }

  // If the user does not have preferences set, create them
  const newUserPreferences = await db.transaction(async (db) => {
    const preferencesRowSitter = await db
      .insert(userSittingPreferences)
      .values({
        userId: user.userId,
        petSitting: preferences.sitForPets,
        houseSitting: preferences.sitForHouses,
        babySitting: preferences.sitForBabies,
        plantSitting: preferences.sitForPlants,
      })
      .returning();

    if (!preferencesRowSitter?.[0]) {
      db.rollback();
      console.log("Failed to set user sitting preferences");
      throw new Error("Failed to set user sitting preferences");
    }

    const preferencesRowOwner = await db
      .insert(userOwnerPreferences)
      .values({
        userId: user.userId,
        petSitting: preferences.wantPetSitting,
        houseSitting: preferences.wantHouseSitting,
        babySitting: preferences.wantBabySitting,
        plantSitting: preferences.wantPlantSitting,
      })
      .returning();

    if (!preferencesRowOwner?.[0]) {
      db.rollback();
      console.log("Failed to set user owner preferences");
      throw new Error("Failed to set user owner preferences");
    }

    return userPreferencesSchema.parse({
      userId: preferencesRowOwner[0].userId,
      wantPetSitting: preferencesRowOwner[0].petSitting,
      wantHouseSitting: preferencesRowOwner[0].houseSitting,
      wantBabySitting: preferencesRowOwner[0].babySitting,
      wantPlantSitting: preferencesRowOwner[0].plantSitting,
      sitForPets: preferencesRowSitter[0].petSitting,
      sitForHouses: preferencesRowSitter[0].houseSitting,
      sitForBabys: preferencesRowSitter[0].babySitting,
      sitForPlants: preferencesRowSitter[0].plantSitting,
    });
  });

  if (newUserPreferences) return newUserPreferences;

  throw new Error("Failed to set user sitting preferences");
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
    for (const subjectId of group.sittingSubjects) {
      const subject = await db
        .insert(subjectsToGroups)
        .values({
          groupId: newGroup[0].id,
          subjectId: subjectId,
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
      sittingSubjectIds: group.sittingSubjects,
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

export async function leaveGroup(groupId: number): Promise<GroupMember> {
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

export async function getGroupMembers(groupId: number) {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const groupMembersList = await db.query.groupMembers.findMany({
    where: (model, { eq }) => eq(model.groupId, groupId),
  });

  return groupMembersList;
}

export async function deleteGroup(groupId: number): Promise<Group> {
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
      group: true,
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
    });
  });
}

export async function createPet(pet: CreatePetFormInput): Promise<Pet> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const petToReturn = await db.transaction(async (db) => {
    const newPet = await db
      .insert(pets)
      .values({
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        dob: pet.dob,
      })
      .returning();

    if (!newPet?.[0]) {
      db.rollback();
      throw new Error("Failed to create pet in pet table");
    }

    const newSittingSubject = await db
      .insert(sittingSubjects)
      .values({
        ownerId: user.userId,
        entityId: newPet[0].id,
        entityType: "Pet",
      })
      .returning();

    if (!newSittingSubject?.[0]) {
      db.rollback();
      throw new Error("Failed to create pet link in sittingSubjects table");
    }

    return petSchema.parse({
      petId: newSittingSubject[0].entityId,
      subjectId: newSittingSubject[0].id,
      ownerId: newSittingSubject[0].ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed ? pet.breed : undefined,
      dob: pet.dob,
    });
  });

  if (petToReturn) {
    return petToReturn;
  }

  throw new Error("Failed to create pet");
}

export async function getOwnedPets(): Promise<Pet[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Join sittingSubjects with pets
  const subjectsList = db
    .select({
      subjectId: sittingSubjects.id,
      entityType: sittingSubjects.entityType,
      entityId: sittingSubjects.entityId,
      ownerId: sittingSubjects.ownerId,
    })
    .from(sittingSubjects)
    .where(
      and(
        eq(sittingSubjects.ownerId, user.userId),
        eq(sittingSubjects.entityType, "Pet"),
      ),
    )
    .as("owned_pet_subjects");

  const joinedPets = await db
    .select()
    .from(subjectsList)
    .innerJoin(pets, eq(subjectsList.entityId, pets.id))
    .execute();

  // Turn into zod pet type
  const petsList: Pet[] = joinedPets.map((petSubject) => {
    return petSchema.parse({
      petId: petSubject.owned_pet_subjects.entityId,
      subjectId: petSubject.owned_pet_subjects.subjectId,
      ownerId: petSubject.owned_pet_subjects.ownerId,
      name: petSubject.pets.name,
      species: petSubject.pets.species,
      breed: petSubject.pets.breed ? petSubject.pets.breed : undefined,
      dob: petSubject.pets.dob,
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
    .where(eq(pets.id, pet.petId))
    .returning()
    .execute();

  if (!updatedPet?.[0]) {
    throw new Error("Failed to update pet");
  }

  return petSchema.parse({
    petId: updatedPet[0].id,
    subjectId: pet.subjectId,
    ownerId: pet.ownerId,
    name: updatedPet[0].name,
    species: updatedPet[0].species,
    breed: updatedPet[0].breed ? updatedPet[0].breed : undefined,
    dob: updatedPet[0].dob,
  });
}

export async function deletePet(subjectId: number): Promise<Pet> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const petToReturn = await db.transaction(async (db) => {
    const deletedSubject = await db
      .delete(sittingSubjects)
      .where(eq(sittingSubjects.id, subjectId))
      .returning();

    if (!deletedSubject?.[0]) {
      db.rollback();
      throw new Error("Failed to delete pet from sittingSubjects table");
    }

    const deletedPet = await db
      .delete(pets)
      .where(eq(pets.id, deletedSubject[0].entityId))
      .returning();

    if (!deletedPet?.[0]) {
      db.rollback();
      throw new Error("Failed to delete pet from pet table");
    }

    return petSchema.parse({
      petId: deletedPet[0].id,
      subjectId: deletedSubject[0].id,
      ownerId: deletedSubject[0].ownerId,
      name: deletedPet[0].name,
      species: deletedPet[0].species,
      breed: deletedPet[0].breed ? deletedPet[0].breed : undefined,
      dob: deletedPet[0].dob,
    });
  });

  if (petToReturn) return petToReturn;

  throw new Error("Failed to delete pet");
}

export async function getOwnedHouses(): Promise<House[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Join sittingSubjects with houses
  const subjectsList = db
    .select({
      subjectId: sittingSubjects.id,
      entityType: sittingSubjects.entityType,
      entityId: sittingSubjects.entityId,
      ownerId: sittingSubjects.ownerId,
    })
    .from(sittingSubjects)
    .where(
      and(
        eq(sittingSubjects.ownerId, user.userId),
        eq(sittingSubjects.entityType, "House"),
      ),
    )
    .as("owned_house_subjects");

  const joinedHouses = await db
    .select()
    .from(subjectsList)
    .innerJoin(houses, eq(subjectsList.entityId, houses.id))
    .execute();

  // Turn into zod house type
  const housesList: House[] = joinedHouses.map((houseSubject) => {
    return houseSchema.parse({
      houseId: houseSubject.owned_house_subjects.entityId,
      subjectId: houseSubject.owned_house_subjects.subjectId,
      ownerId: houseSubject.owned_house_subjects.ownerId,
      name: houseSubject.houses.name,
      address: houseSubject.houses.address,
    });
  });

  return housesList;
}

export async function createHouse(house: CreateHouseFormInput): Promise<House> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const houseToReturn = await db.transaction(async (db) => {
    const newHouse = await db
      .insert(houses)
      .values({
        name: house.name,
        address: house.address,
      })
      .returning();

    if (!newHouse?.[0]) {
      db.rollback();
      throw new Error("Failed to create house in house table");
    }

    const newSittingSubject = await db
      .insert(sittingSubjects)
      .values({
        ownerId: user.userId,
        entityId: newHouse[0].id,
        entityType: "House",
      })
      .returning();

    if (!newSittingSubject?.[0]) {
      db.rollback();
      throw new Error("Failed to create house link in sittingSubjects table");
    }

    return houseSchema.parse({
      houseId: newHouse[0].id,
      subjectId: newSittingSubject[0].id,
      ownerId: newSittingSubject[0].ownerId,
      name: newHouse[0].name,
      address: newHouse[0].address ? newHouse[0].address : undefined,
    });
  });

  if (houseToReturn) return houseToReturn;

  throw new Error("Failed to create house");
}

export async function updateHouse(house: House): Promise<House> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const updatedHouse = await db
    .update(houses)
    .set({
      name: house.name,
      address: house.address,
    })
    .where(eq(houses.id, house.houseId))
    .returning()
    .execute();

  if (!updatedHouse?.[0]) {
    throw new Error("Failed to update house");
  }

  return houseSchema.parse({
    houseId: updatedHouse[0].id,
    subjectId: house.subjectId,
    ownerId: house.ownerId,
    name: updatedHouse[0].name,
    address: updatedHouse[0].address ? updatedHouse[0].address : undefined,
  });
}

export async function deleteHouse(subjectId: number): Promise<House> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const houseToReturn = await db.transaction(async (db) => {
    const deletedSubject = await db
      .delete(sittingSubjects)
      .where(eq(sittingSubjects.id, subjectId))
      .returning();

    if (!deletedSubject?.[0]) {
      db.rollback();
      throw new Error("Failed to delete house from sittingSubjects table");
    }

    const deletedHouse = await db
      .delete(houses)
      .where(eq(houses.id, deletedSubject[0].entityId))
      .returning();

    if (!deletedHouse?.[0]) {
      db.rollback();
      throw new Error("Failed to delete house from house table");
    }

    return houseSchema.parse({
      houseId: deletedHouse[0].id,
      subjectId: deletedSubject[0].id,
      ownerId: deletedSubject[0].ownerId,
      name: deletedHouse[0].name,
      address: deletedHouse[0].address ? deletedHouse[0].address : undefined,
    });
  });

  if (houseToReturn) return houseToReturn;

  throw new Error("Failed to delete house");
}

export async function getOwnedPlants(): Promise<Plant[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Join sittingSubjects with plants
  const subjectsList = db
    .select({
      subjectId: sittingSubjects.id,
      entityType: sittingSubjects.entityType,
      entityId: sittingSubjects.entityId,
      ownerId: sittingSubjects.ownerId,
    })
    .from(sittingSubjects)
    .where(
      and(
        eq(sittingSubjects.ownerId, user.userId),
        eq(sittingSubjects.entityType, "Plant"),
      ),
    )
    .as("owned_plant_subjects");

  const joinedPlants = await db
    .select()
    .from(subjectsList)
    .innerJoin(plants, eq(subjectsList.entityId, plants.id))
    .execute();

  // Turn into zod plant type
  const plantsList: Plant[] = joinedPlants.map((plantSubject) => {
    return plantSchema.parse({
      plantId: plantSubject.owned_plant_subjects.entityId,
      subjectId: plantSubject.owned_plant_subjects.subjectId,
      ownerId: plantSubject.owned_plant_subjects.ownerId,
      name: plantSubject.plants.name,
      species: plantSubject.plants.species
        ? plantSubject.plants.species
        : undefined,
      lastWatered: plantSubject.plants.lastWatered
        ? plantSubject.plants.lastWatered
        : undefined,
      wateringFrequency: plantSubject.plants.wateringFrequency,
    });
  });

  return plantsList;
}

export async function createPlant(plant: CreatePlantFormInput): Promise<Plant> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const plantToReturn = await db.transaction(async (db) => {
    const newPlant = await db
      .insert(plants)
      .values({
        name: plant.name,
        species: plant.species,
        lastWatered: plant.lastWatered,
        wateringFrequency: plant.wateringFrequency,
      })
      .returning();

    if (!newPlant?.[0]) {
      db.rollback();
      throw new Error("Failed to create plant in plant table");
    }

    const newSittingSubject = await db
      .insert(sittingSubjects)
      .values({
        ownerId: user.userId,
        entityId: newPlant[0].id,
        entityType: "Plant",
      })
      .returning();

    if (!newSittingSubject?.[0]) {
      db.rollback();
      throw new Error("Failed to create plant link in sittingSubjects table");
    }

    return plantSchema.parse({
      plantId: newPlant[0].id,
      subjectId: newSittingSubject[0].id,
      ownerId: newSittingSubject[0].ownerId,
      name: plant.name,
      species: plant.species ? plant.species : undefined,
      lastWatered: plant.lastWatered ? plant.lastWatered : undefined,
      wateringFrequency: plant.wateringFrequency,
    });
  });

  if (plantToReturn) return plantToReturn;

  throw new Error("Failed to create plant");
}

export async function updatePlant(plant: Plant): Promise<Plant> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const updatedPlant = await db
    .update(plants)
    .set({
      name: plant.name,
      species: plant.species,
      lastWatered: plant.lastWatered,
      wateringFrequency: plant.wateringFrequency,
    })
    .where(eq(plants.id, plant.plantId))
    .returning()
    .execute();

  if (!updatedPlant?.[0]) {
    throw new Error("Failed to update plant");
  }

  return plantSchema.parse({
    plantId: updatedPlant[0].id,
    subjectId: plant.subjectId,
    ownerId: plant.ownerId,
    name: updatedPlant[0].name,
    species: updatedPlant[0].species ? updatedPlant[0].species : undefined,
    lastWatered: updatedPlant[0].lastWatered
      ? updatedPlant[0].lastWatered
      : undefined,
    wateringFrequency: updatedPlant[0].wateringFrequency,
  });
}

export async function deletePlant(subjectId: number): Promise<Plant> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  const plantToReturn = await db.transaction(async (db) => {
    const deletedSubject = await db
      .delete(sittingSubjects)
      .where(eq(sittingSubjects.id, subjectId))
      .returning();

    if (!deletedSubject?.[0]) {
      db.rollback();
      throw new Error("Failed to delete plant from sittingSubjects table");
    }

    const deletedPlant = await db
      .delete(plants)
      .where(eq(plants.id, deletedSubject[0].entityId))
      .returning();

    if (!deletedPlant?.[0]) {
      db.rollback();
      throw new Error("Failed to delete plant from plant table");
    }

    return plantSchema.parse({
      plantId: deletedPlant[0].id,
      subjectId: deletedSubject[0].id,
      ownerId: deletedSubject[0].ownerId,
      name: deletedPlant[0].name,
      species: deletedPlant[0].species ? deletedPlant[0].species : undefined,
      lastWatered: deletedPlant[0].lastWatered
        ? deletedPlant[0].lastWatered
        : undefined,
      wateringFrequency: deletedPlant[0].wateringFrequency,
    });
  });

  if (plantToReturn) return plantToReturn;

  throw new Error("Failed to delete plant");
}

// Make this a return a defined type with zod so the frontend can be made nicer
export async function getOwnedSubjects(): Promise<SittingSubject[]> {
  const user = auth();

  if (!user.userId) {
    throw new Error("Unauthorized");
  }

  // Get pets, houses, and plants
  const petsList = await getOwnedPets();
  const housesList = await getOwnedHouses();
  const plantsList = await getOwnedPlants();

  // Combine all subjects
  const allSubjects = [...petsList, ...housesList, ...plantsList];

  return allSubjects;
}
