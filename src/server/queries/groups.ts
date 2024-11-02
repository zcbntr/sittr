"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { eq, and, inArray } from "drizzle-orm";
import {
  groupInviteCodes,
  usersToGroups,
  groups,
  pets,
  petsToGroups,
} from "../db/schema";
import {
  type petToGroupFormInput,
  type CreateGroupFormInput,
  type RequestGroupInviteCodeFormInput,
  type UserGroupPair,
  type PetsToGroupFormInput,
} from "~/lib/schema";
import {
  type Group,
  type GroupInviteCode,
  groupInviteCodeSchema,
  type GroupMember,
  type GroupPet,
  groupPetSchema,
  GroupRoleEnum,
  groupSchema,
  type PetToGroup,
  type PetToGroupList,
  RoleEnum,
  type UserToGroup,
  userToGroupSchema,
} from "~/lib/schema/groupschemas";
import { type Pet, petSchema } from "~/lib/schema/petschemas";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function getGroupById(id: string): Promise<Group | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const group = await db.query.groups.findFirst({
    where: (model, { eq }) => eq(model.id, id),
  });

  if (!group) {
    return "Group not found";
  }

  return groupSchema.parse({
    id: group.id,
    name: group.name,
    description: group.description,
  });
}

export async function getGroupsByIds(ids: string[]): Promise<Group[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
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

export async function createGroup(
  group: CreateGroupFormInput,
): Promise<Group | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Create group, add user to groupMembers, add pets to group, all in a transaction
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
      .insert(usersToGroups)
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

    // Add pets to group
    for (const petId of group.petIds) {
      const petToGroupRow = await db
        .insert(petsToGroups)
        .values({
          groupId: newGroup[0].id,
          petId: petId,
        })
        .returning()
        .execute();

      if (!petToGroupRow?.[0]) {
        db.rollback();
        throw new Error("Failed to add pet to group");
      }
    }

    return groupSchema.parse({
      id: newGroup[0].id,
      name: newGroup[0].name,
      description: newGroup[0].description,
    });
  });

  if (groupToReturn) return groupToReturn;

  throw new Error("Failed to create group");
}

export async function getNewGroupInviteCode(
  request: RequestGroupInviteCodeFormInput,
): Promise<GroupInviteCode | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Check user is the owner of the group
  const ownerRow = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, request.groupId),
        eq(model.userId, user.userId),
        eq(model.role, RoleEnum.Values.Owner),
      ),
  });

  if (!ownerRow) {
    return "You are either not the owner of the group, not a member, or the group doesn't exist";
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

  const newInviteCodeRow = await db
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

  if (!newInviteCodeRow?.[0]) {
    throw new Error("Failed to create invite code");
  }

  return groupInviteCodeSchema.parse({
    id: newInviteCodeRow[0].id,
    groupId: newInviteCodeRow[0].groupId,
    createdBy: user.userId,
    code: newInviteCodeRow[0].code,
    maxUses: newInviteCodeRow[0].maxUses,
    uses: newInviteCodeRow[0].uses,
    expiresAt: newInviteCodeRow[0].expiresAt,
    requiresApproval: newInviteCodeRow[0].requiresApproval,
  });
}

export enum InviteApiError {
  GroupNotFound = "GroupNotFound",
  InviteNotFound = "InviteNotFound",
  InviteExpired = "InviteExpired",
  InviteMaxUsesReached = "InviteMaxUsesReached",
  UserAlreadyInGroup = "UserAlreadyInGroup",
  Unauthorized = "Unauthorized",
}

export async function joinGroup(
  inviteCode: string,
): Promise<undefined | InviteApiError> {
  const user = await auth();

  if (!user.userId) {
    return InviteApiError.Unauthorized;
  }

  // This needs to be a find many if there becomes lots of groups
  const inviteCodeRow = await db.query.groupInviteCodes.findFirst({
    where: (model, { eq }) => eq(model.code, inviteCode),
  });

  if (!inviteCodeRow) {
    return InviteApiError.InviteNotFound;
  }

  // Check if the invite code has expired
  if (inviteCodeRow.expiresAt < new Date()) {
    // Delete code
    await db
      .delete(groupInviteCodes)
      .where(eq(groupInviteCodes.id, inviteCodeRow.id))
      .execute();

    return InviteApiError.InviteExpired;
  }

  // Check if the invite code has reached its max uses
  if (inviteCodeRow.uses >= inviteCodeRow.maxUses) {
    // Delete code
    await db
      .delete(groupInviteCodes)
      .where(eq(groupInviteCodes.id, inviteCodeRow.id))
      .execute();

    return InviteApiError.InviteMaxUsesReached;
  }

  // Check if the user is already in the group
  const existingGroupRow = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, inviteCodeRow.groupId),
        eq(model.userId, user.userId),
      ),
  });

  if (existingGroupRow) {
    return InviteApiError.UserAlreadyInGroup;
  }

  // Add the user to the group
  const newGroupMember = await db
    .insert(usersToGroups)
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
    throw new Error("Database insert failed");
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
}

export async function leaveGroup(
  groupId: string,
): Promise<UserToGroup | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(eq(model.groupId, groupId), eq(model.userId, user.userId)),
  });

  if (!groupMember) {
    return "You are not a member of the group you are trying to leave";
  }

  const deletedGroupMember = await db
    .delete(usersToGroups)
    .where(
      and(
        eq(usersToGroups.userId, user.userId),
        eq(usersToGroups.groupId, groupId),
      ),
    )
    .returning();

  if (!deletedGroupMember[0]) {
    throw new Error("Failed to delete group member");
  }

  return userToGroupSchema.parse({
    groupId: deletedGroupMember[0].groupId,
    userId: deletedGroupMember[0].userId,
    role: deletedGroupMember[0].role,
  });
}

export async function getIsUserGroupOwner(
  groupId: string,
): Promise<boolean | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  return !!groupMember;
}

export async function getGroupMembers(
  groupId: string,
): Promise<GroupMember[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const userToGroupRows = await db.query.usersToGroups.findMany({
    where: (model, { eq }) => eq(model.groupId, groupId),
  });

  const loggedInUserId = userToGroupRows.map((row) => row.userId)[0];

  if (!loggedInUserId) {
    throw new Error("Failed to get userId");
  }

  const clerkUsers = await clerkClient.users.getUserList();

  if (!clerkUsers) {
    throw new Error("Failed to get users from Clerk");
  }

  return userToGroupRows.map((row) => {
    const user = clerkUsers.data.find((user) => user.id === row.userId);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: row.id,
      groupId: row.groupId,
      userId: user.id,
      name: user.firstName ? user.firstName + " " + user.lastName : "Unknown",
      avatar: user.imageUrl,
      role: row.role,
    };
  });
}

export async function addMemberToGroup(
  userId: string,
  groupId: string,
): Promise<UserToGroup | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Check user is the owner of the group
  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (!groupMember) {
    return "You are not the owner of the group";
  }

  const newGroupMember = await db
    .insert(usersToGroups)
    .values({
      groupId: groupId,
      userId: userId,
      role: GroupRoleEnum.Values.Member,
    })
    .returning()
    .execute();

  if (!newGroupMember?.[0]) {
    throw new Error("Failed to add member to group");
  }

  return userToGroupSchema.parse({
    groupId: newGroupMember[0].groupId,
    userId: newGroupMember[0].userId,
    role: newGroupMember[0].role,
  });
}

export async function removeUserFromGroup(
  userGroupPair: UserGroupPair,
): Promise<UserToGroup | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Check user is the owner of the group
  const ownerRow = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, userGroupPair.groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (!ownerRow) {
    return "You are not the owner of the group";
  }

  // Check if the user is trying to remove themselves
  if (user.userId === userGroupPair.userId) {
    return "You cannot remove yourself a group you own. Either transfer ownership to another user before leaving or delete the group instead";
  }

  const removedGroupMember = await db
    .delete(usersToGroups)
    .where(
      and(
        eq(usersToGroups.groupId, userGroupPair.groupId),
        eq(usersToGroups.userId, userGroupPair.userId),
      ),
    )
    .returning();

  if (!removedGroupMember[0]) {
    throw new Error("Failed to remove member from group");
  }

  return userToGroupSchema.parse({
    groupId: removedGroupMember[0].groupId,
    userId: removedGroupMember[0].userId,
    role: removedGroupMember[0].role,
  });
}

export async function getGroupPets(
  groupId: string,
): Promise<GroupPet[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const groupPetsList = await db
    .select()
    .from(pets)
    .leftJoin(petsToGroups, eq(petsToGroups.petId, pets.id))
    .where(eq(petsToGroups.groupId, groupId));

  if (!groupPetsList) {
    throw new Error("Failed to get pets of group");
  }

  return groupPetsList.map((pet) => {
    if (pet.pets_to_groups === null) {
      throw new Error("Failed to get pets of group");
    }

    return groupPetSchema.parse({
      id: pet.pets_to_groups.id,
      petId: pet.pets.id,
      groupId: pet.pets_to_groups.groupId,
      ownerId: pet.pets.ownerId,
      name: pet.pets.name,
      species: pet.pets.species,
      breed: pet.pets.breed,
      dob: pet.pets.dob,
    });
  });
}

export async function addPetToGroup(
  petToGroup: petToGroupFormInput,
): Promise<PetToGroup | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Check user is the owner of the group
  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, petToGroup.groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (!groupMember) {
    return "You are not the owner of the group";
  }

  const newPetToGroup = await db
    .insert(petsToGroups)
    .values({
      groupId: petToGroup.groupId,
      petId: petToGroup.petId,
    })
    .returning()
    .execute();

  if (!newPetToGroup?.[0]) {
    throw new Error("Failed to add pet to group");
  }

  return newPetToGroup[0];
}

export async function addPetsToGroup(
  petToGroup: PetsToGroupFormInput,
): Promise<PetToGroupList | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Check user is the owner of the group
  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, petToGroup.groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (!groupMember) {
    return "You are not the owner of the group";
  }

  const newPetToGroups = await db
    .insert(petsToGroups)
    .values(
      petToGroup.petIds.map((petId) => ({
        groupId: petToGroup.groupId,
        petId,
      })),
    )
    .returning()
    .execute();

  if (newPetToGroups.length == 0) {
    throw new Error("Failed to add pets to group");
  }

  return newPetToGroups;
}

export async function getUsersPetsNotInGroup(
  groupId: string,
): Promise<Pet[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const petsNotInGroup = await db.query.pets.findMany({
    where: (model, { and, not, inArray }) =>
      and(
        not(
          inArray(
            model.id,
            db
              .select({ petId: petsToGroups.petId })
              .from(petsToGroups)
              .where(eq(petsToGroups.groupId, groupId)),
          ),
        ),
        eq(model.ownerId, user.userId),
      ),
  });

  if (!petsNotInGroup) {
    throw new Error("Failed to get users pets not in group");
  }

  return petsNotInGroup.map((pet) => {
    return petSchema.parse({
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      dob: pet.dob,
    });
  });
}

export async function removePetFromGroup(
  petToGroup: petToGroupFormInput,
): Promise<PetToGroup | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Check user is the owner of the group
  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, petToGroup.groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (!groupMember) {
    return "You are not the owner of the group";
  }

  const removedPetFromGroup = await db
    .delete(petsToGroups)
    .where(
      and(
        eq(petsToGroups.groupId, petToGroup.groupId),
        eq(petsToGroups.petId, petToGroup.petId),
      ),
    )
    .returning();

  if (!removedPetFromGroup[0]) {
    throw new Error("Failed to remove pet from group");
  }

  return removedPetFromGroup[0];
}

export async function updateGroup(group: Group): Promise<Group | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Check user is the owner of the group
  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, group.id),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (!groupMember) {
    return "You are not the owner of the group";
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

export async function deleteGroup(groupId: string): Promise<Group | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  // Check user is the owner of the group
  const groupMember = await db.query.usersToGroups.findFirst({
    where: (model, { and, eq }) =>
      and(
        eq(model.groupId, groupId),
        eq(model.userId, user.userId),
        eq(model.role, "Owner"),
      ),
  });

  if (!groupMember) {
    return "You are not the owner of the group";
  }

  const deletedGroup = await db
    .delete(groups)
    .where(eq(groups.id, groupId))
    .returning();

  if (!deletedGroup[0]) {
    throw new Error("Failed to delete group");
  }

  // Database cascade should delete usersToGroups and petsToGroups, fingers crossed!

  return groupSchema.parse({
    id: deletedGroup[0].id,
    name: deletedGroup[0].name,
    description: deletedGroup[0].description,
  });
}

export async function getGroupsUserIsIn(): Promise<Group[] | string> {
  const user = await auth();

  if (!user.userId) {
    return "Unauthorized";
  }

  const groupMemberList = await db.query.usersToGroups.findMany({
    where: (model, { eq }) => eq(model.userId, user.userId),
    with: {
      group: {
        with: {
          usersToGroups: true,
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
    });
  });
}
