"use server";

import {
  acceptPendingMemberSchema,
  createGroupInputSchema,
  groupDetailsSchema,
  joinGroupFormSchema,
  petsToGroupFormInputSchema,
  petToGroupFormInputSchema,
  requestGroupInviteCodeFormInputSchema,
  userGroupPairSchema,
} from "~/lib/schemas/groups";
import { db } from "../db";
import { authenticatedProcedure, ownsGroupProcedure } from "./zsa-procedures";
import {
  groupInviteCodes,
  groups,
  notifications,
  petsToGroups,
  usersToGroups,
} from "../db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMilliseconds } from "date-fns";
import { ratelimit } from "../ratelimit";
import { GroupRoleEnum } from "~/lib/schemas";

export const createGroupAction = authenticatedProcedure
  .createServerAction()
  .input(createGroupInputSchema)
  .handler(async ({ input, ctx }) => {
    const userId = ctx.user.id;

    // Create group, add user to groupMembers, add pets to group, all in a transaction
    await db.transaction(async (db) => {
      // Create group
      const newGroup = await db
        .insert(groups)
        .values({
          creatorId: userId,
          name: input.name,
          description: input.description,
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
          userId: userId,
          role: GroupRoleEnum.Values.Owner,
        })
        .returning()
        .execute();

      if (!groupMember?.[0]) {
        db.rollback();
        throw new Error("Failed to add user to group");
      }

      // Add pets to group
      for (const petId of input.petIds) {
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
    });

    revalidatePath("/my-groups");
  });

export const updateGroupDetailsAction = ownsGroupProcedure
  .createServerAction()
  .input(groupDetailsSchema)
  .handler(async ({ input }) => {
    await db
      .update(groups)
      .set({
        name: input.name,
        description: input.description,
      })
      .where(eq(groups.id, input.groupId))
      .execute();

    revalidatePath(`/group/${input.groupId}`);
  });

export const deleteGroupAction = ownsGroupProcedure
  .createServerAction()
  .input(z.object({ groupId: z.string() }))
  .handler(async ({ ctx, input }) => {
    const { userId } = ctx;
    const { success } = await ratelimit.limit(userId);

    if (!success) {
      throw new Error("You are deleting groups too fast");
    }

    await db.delete(groups).where(eq(groups.id, input.groupId)).execute();

    // Notify all users in the group of the deletion
    const groupMembers = await db.query.usersToGroups.findMany({
      where: (model, { eq }) => eq(model.groupId, input.groupId),
    });

    for (const member of groupMembers) {
      // Ignore the user who deleted the group (owner)
      if (member.role === GroupRoleEnum.Values.Owner) {
        continue;
      }

      await db
        .insert(notifications)
        .values({
          userId: member.userId,
          associatedGroup: input.groupId,
          message: `The group ${input.groupId} has been deleted`,
        })
        .execute();
    }

    redirect("/my-groups");
  });

export const addPetToGroupAction = ownsGroupProcedure
  .createServerAction()
  .input(petToGroupFormInputSchema)
  .handler(async ({ input }) => {
    await db
      .insert(petsToGroups)
      .values({
        groupId: input.groupId,
        petId: input.petId,
      })
      .execute();

    // Notify all users in the group of the addition
    const groupMembers = await db.query.usersToGroups.findMany({
      where: (model, { eq }) => eq(model.groupId, input.groupId),
    });

    const pet = await db.query.pets.findFirst({
      where: (model, { eq }) => eq(model.id, input.petId),
    });

    for (const member of groupMembers) {
      // Ignore the user who added the pet (owner)
      if (member.role === GroupRoleEnum.Values.Owner) {
        continue;
      }

      await db
        .insert(notifications)
        .values({
          userId: member.userId,
          associatedGroup: input.groupId,
          message: `The pet ${pet?.name} has been added to the group`,
        })
        .execute();
    }

    revalidatePath(`/group/${input.groupId}`);
  });

export const addPetsToGroupAction = ownsGroupProcedure
  .createServerAction()
  .input(petsToGroupFormInputSchema)
  .handler(async ({ input }) => {
    await db.transaction(async (db) => {
      for (const petId of input.petIds) {
        await db
          .insert(petsToGroups)
          .values({
            groupId: input.groupId,
            petId: petId,
          })
          .execute();
      }
    });

    // Notify all users in the group of the addition
    const groupMembers = await db.query.usersToGroups.findMany({
      where: (model, { eq }) => eq(model.groupId, input.groupId),
    });

    const group = await db.query.groups.findFirst({
      where: (model, { eq }) => eq(model.id, input.groupId),
    });

    for (const member of groupMembers) {
      // Ignore the user who added the pet (owner)
      if (member.role === GroupRoleEnum.Values.Owner) {
        continue;
      }

      await db
        .insert(notifications)
        .values({
          userId: member.userId,
          associatedGroup: input.groupId,
          message: `Multiple pets have been added to ${group?.name}`,
        })
        .execute();
    }

    revalidatePath(`/group/${input.groupId}`);
  });

export const removePetFromGroupAction = ownsGroupProcedure
  .createServerAction()
  .input(petToGroupFormInputSchema)
  .handler(async ({ input }) => {
    await db
      .delete(petsToGroups)
      .where(
        and(
          eq(petsToGroups.groupId, input.groupId),
          eq(petsToGroups.petId, input.petId),
        ),
      )
      .execute();

    revalidatePath(`/group/${input.groupId}`);
  });

export const addUserToGroupAction = ownsGroupProcedure
  .createServerAction()
  .input(userGroupPairSchema)
  .handler(async ({ input }) => {
    const { success } = await ratelimit.limit(input.userId);

    if (!success) {
      throw new Error("You are adding users to the group too fast");
    }

    // Check user is not trying to add themselves
    if (input.userId === input.groupId) {
      throw new Error("Cannot add yourself to your own group");
    }

    await db
      .insert(usersToGroups)
      .values({
        groupId: input.groupId,
        userId: input.userId,
        role: GroupRoleEnum.Values.Member,
      })
      .execute();

    revalidatePath(`/groups/${input.groupId}`);
  });

export const removeUserFromGroupAction = ownsGroupProcedure
  .createServerAction()
  .input(userGroupPairSchema)
  .handler(async ({ input }) => {
    const { success } = await ratelimit.limit(input.userId);

    if (!success) {
      throw new Error("You are removing users too fast");
    }

    // Check if user is trying to remove themselves
    if (input.userId === input.groupId) {
      throw new Error("Cannot remove yourself from your own group");
    }

    // Check if user is the last owner of the group
    const ownerCount = await db
      .select()
      .from(usersToGroups)
      .where(
        and(
          eq(usersToGroups.groupId, input.groupId),
          eq(usersToGroups.role, GroupRoleEnum.Values.Owner),
        ),
      )
      .execute()
      .then((rows) => rows.length);

    if (ownerCount === 1) {
      throw new Error(
        "You cannot remove the last owner of a group. Delete the group instead.",
      );
    }

    await db
      .delete(usersToGroups)
      .where(
        and(
          eq(usersToGroups.groupId, input.groupId),
          eq(usersToGroups.userId, input.userId),
        ),
      )
      .execute();

    revalidatePath(`/group/${input.groupId}`);
  });

export const leaveGroupAction = authenticatedProcedure
  .createServerAction()
  .input(z.object({ groupId: z.string() }))
  .handler(async ({ input, ctx }) => {
    const userId = ctx.user.id;

    // Check if user is the last owner of the group
    const ownerCount = await db
      .select()
      .from(usersToGroups)
      .where(
        and(
          eq(usersToGroups.groupId, input.groupId),
          eq(usersToGroups.role, GroupRoleEnum.Values.Owner),
        ),
      )
      .execute()
      .then((rows) => rows.length);

    if (ownerCount === 1) {
      throw new Error(
        "You cannot leave as the last owner of a group. Delete the group instead.",
      );
    }

    await db
      .delete(usersToGroups)
      .where(
        and(
          eq(usersToGroups.groupId, input.groupId),
          eq(usersToGroups.userId, userId),
        ),
      )
      .execute();

    // Notify the owner of the group that the user has left
    const group = await db.query.groups.findFirst({
      where: (model, { eq }) => eq(model.id, input.groupId),
    });

    const owner = await db.query.usersToGroups.findFirst({
      where: (model, { eq }) =>
        and(
          eq(model.groupId, input.groupId),
          eq(model.role, GroupRoleEnum.Values.Owner),
        ),
    });

    const leavingUser = await db.query.users.findFirst({
      where: (model, { eq }) => eq(model.id, userId),
    });

    if (owner) {
      await db
        .insert(notifications)
        .values({
          userId: owner.userId,
          associatedGroup: input.groupId,
          message: `${leavingUser?.name} has left ${group?.name}`,
        })
        .execute();
    }

    redirect("/my-groups");
  });

export const joinGroupAction = authenticatedProcedure
  .createServerAction()
  .input(joinGroupFormSchema)
  .handler(async ({ input, ctx }) => {
    const userId = ctx.user.id;

    // This needs to be a find many if there becomes lots of groups
    const inviteCodeRow = await db.query.groupInviteCodes.findFirst({
      where: (model, { eq }) => eq(model.code, input.inviteCode),
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

    // Add the user to the group
    const newGroupMember = await db
      .insert(usersToGroups)
      .values({
        groupId: inviteCodeRow.groupId,
        userId: userId,
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

    redirect(`/group/${inviteCodeRow.groupId}`);
  });

export const acceptPendingUserAction = ownsGroupProcedure
  .createServerAction()
  .input(acceptPendingMemberSchema)
  .handler(async ({ input }) => {
    const { groupId, userId } = input;

    // Change the role of the user to member from pending
    const member = await db
      .update(usersToGroups)
      .set({ role: GroupRoleEnum.Values.Member })
      .where(
        and(
          eq(usersToGroups.userId, userId),
          eq(usersToGroups.groupId, groupId),
          eq(usersToGroups.role, GroupRoleEnum.Values.Pending),
        ),
      )
      .returning()
      .execute();

    if (member) {
      // Notify the user that they have been accepted
      const group = await db.query.groups.findFirst({
        where: (model, { eq }) => eq(model.id, groupId),
      });

      await db
        .insert(notifications)
        .values({
          userId: userId,
          associatedGroup: groupId,
          message: `You have been accepted into ${group?.name}`,
        })
        .execute();

      revalidatePath(`/group/${groupId}`);
      return;
    }

    // Check if the user exists
    const pending = await db.query.usersToGroups.findFirst({
      where: (model, { eq }) => eq(model.userId, userId),
    });

    if (pending)
      throw new Error(
        `Error: User ${pending.userId} has role ${pending.role.toString()}`,
      );
    else throw new Error("User does not exist");
  });

export const rejectPendingUserAction = ownsGroupProcedure
  .createServerAction()
  .input(acceptPendingMemberSchema)
  .handler(async ({ input }) => {
    const { groupId, userId } = input;

    // Delete the user from members
    const member = await db
      .delete(usersToGroups)
      .where(
        and(
          eq(usersToGroups.userId, userId),
          eq(usersToGroups.groupId, groupId),
          eq(usersToGroups.role, GroupRoleEnum.Values.Pending),
        ),
      )
      .returning()
      .execute();

    if (member) {
      // Notify the user that they have been rejected
      const group = await db.query.groups.findFirst({
        where: (model, { eq }) => eq(model.id, groupId),
      });

      await db
        .insert(notifications)
        .values({
          userId: userId,
          associatedGroup: groupId,
          message: `You have been rejected from ${group?.name}`,
        })
        .execute();

      revalidatePath(`/group/${groupId}`);
      return;
    }

    // Check if the user exists
    const pending = await db.query.usersToGroups.findFirst({
      where: (model, { eq }) => eq(model.userId, userId),
    });

    if (pending)
      throw new Error(
        `Error: User ${pending.userId} has role ${pending.role.toString()}`,
      );
    else throw new Error("User does not exist");
  });

export const createGroupInviteCodeAction = ownsGroupProcedure
  .createServerAction()
  .input(requestGroupInviteCodeFormInputSchema)
  .handler(async ({ input, ctx }) => {
    const { userId } = ctx;

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

    let expiresIn = 0;
    switch (input.expiresIn) {
      case "24 Hours":
        expiresIn = 24 * 60 * 60 * 1000;
        break;
      case "48 Hours":
        expiresIn = 48 * 60 * 60 * 1000;
        break;
      case "1 Week":
        expiresIn = 7 * 24 * 60 * 60 * 1000;
        break;
      case "1 Month":
        expiresIn = 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error("Invalid expiry date");
    }

    const expiresAt = addMilliseconds(new Date(), expiresIn);

    const newInviteCodeRow = await db
      .insert(groupInviteCodes)
      .values({
        creatorId: userId,
        groupId: input.groupId,
        code: inviteCode,
        maxUses: input.maxUses,
        expiresAt: expiresAt,
        requiresApproval: input.requiresApproval,
      })
      .returning()
      .execute();

    if (!newInviteCodeRow?.[0]) {
      throw new Error("Failed to create invite code");
    }

    const code = `https://sittr.uk/join-group/${newInviteCodeRow[0].code}`;

    return { code };
  });
