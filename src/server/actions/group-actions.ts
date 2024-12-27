"use server";

import {
  acceptPendingMemberSchema,
  insertGroupWithPetsSchema,
  joinGroupFormSchema,
  petsToGroupFormInputSchema,
  petToGroupFormInputSchema,
  requestGroupInviteCodeFormInputSchema,
  updateGroupSchema,
  userGroupPairSchema,
} from "~/lib/schemas/groups";
import { db } from "../db";
import { authenticatedProcedure, ownsGroupProcedure } from "./zsa-procedures";
import {
  groupInviteCodes,
  groups,
  notifications,
  petsToGroups,
  groupMembers,
} from "../db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMilliseconds } from "date-fns";
import { ratelimit } from "../ratelimit";
import { GroupRoleEnum, NotificationTypeEnum } from "~/lib/schemas";
import { randomString } from "~/lib/utils";

export const createGroupAction = authenticatedProcedure
  .createServerAction()
  .input(insertGroupWithPetsSchema)
  .handler(async ({ input, ctx }) => {
    const user = ctx.user;

    // Check if the user already has maximum groups for their plan
    const userGroups = await db.query.groupMembers.findMany({
      where: (model, { eq, and }) =>
        and(
          eq(model.role, GroupRoleEnum.Values.Owner),
          eq(model.userId, user.id),
        ),
    });

    if (!userGroups) {
      throw new Error("Could not fetch user's group");
    }

    if (
      (user.plusMembership && userGroups.length >= 100) ||
      (!user.plusMembership && userGroups.length >= 5)
    ) {
      throw new Error("Reached maximum groups for your plan");
    }

    const petIds = input.petIds;
    delete input.petIds;

    // Create group, add user to groupMembers, add pets to group, all in a transaction
    await db.transaction(async (db) => {
      // Create group
      const newGroup = await db
        .insert(groups)
        .values({ ...input, creatorId: user.id })
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
          userId: user.id,
          role: GroupRoleEnum.Values.Owner,
        })
        .returning()
        .execute();

      if (!groupMember?.[0]) {
        db.rollback();
        throw new Error("Failed to add user to group");
      }

      // Add pets to group
      if (!petIds) {
        return;
      }

      for (const petId of petIds) {
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

export const updateGroupAction = ownsGroupProcedure
  .createServerAction()
  .input(updateGroupSchema)
  .handler(async ({ input, ctx }) => {
    const { group } = ctx;

    if (input?.id) delete input.id;

    await db
      .update(groups)
      .set({ ...input })
      .where(eq(groups.id, group.id))
      .execute();

    revalidatePath(`/group/${group.id}`);
  });

export const deleteGroupAction = ownsGroupProcedure
  .createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ ctx, input }) => {
    const user = ctx.user;
    const { success } = await ratelimit.limit(user.id);

    if (!success) {
      throw new Error("You are deleting groups too fast");
    }

    await db.delete(groups).where(eq(groups.id, input.id)).execute();

    // Notify all users in the group of the deletion
    const groupMembers = await db.query.groupMembers.findMany({
      where: (model, { eq }) => eq(model.groupId, input.id),
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
          associatedGroupId: input.id,
          notificationType:
            NotificationTypeEnum.Values["Group Member Of Deleted"],
          message: `The group ${input.id} has been deleted`,
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
    const groupMembers = await db.query.groupMembers.findMany({
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
          associatedGroupId: input.groupId,
          notificationType: NotificationTypeEnum.Values["Pet Added To Group"],
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
    const groupMembersRows = await db.query.groupMembers.findMany({
      where: (model, { eq }) => eq(model.groupId, input.groupId),
    });

    const groupRow = await db.query.groups.findFirst({
      where: (model, { eq }) => eq(model.id, input.groupId),
    });

    for (const member of groupMembersRows) {
      // Ignore the user who added the pet (owner)
      if (member.role === GroupRoleEnum.Values.Owner) {
        continue;
      }

      await db
        .insert(notifications)
        .values({
          userId: member.userId,
          associatedGroupId: input.groupId,
          notificationType: NotificationTypeEnum.Values["Pet Added To Group"],
          message: `Multiple pets have been added to ${groupRow?.name}`,
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
  .handler(async ({ input, ctx }) => {
    const owner = ctx.user;

    // Check if the group is full (5 members for free tier, 101 for plus tier)
    const groupMemberRows = await db.query.groupMembers.findMany({
      where: (model, { eq }) => eq(model.groupId, input.groupId),
    });

    if (
      (owner.plusMembership && groupMemberRows.length >= 101) ||
      (!owner.plusMembership && groupMemberRows.length >= 6)
    ) {
      throw new Error("Max group size reached");
    }

    const { success } = await ratelimit.limit(input.userId);

    if (!success) {
      throw new Error("You are adding users to the group too fast");
    }

    // Check user is not trying to add themselves
    if (input.userId === input.groupId) {
      throw new Error("Cannot add yourself to your own group");
    }

    await db
      .insert(groupMembers)
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
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, input.groupId),
          eq(groupMembers.role, GroupRoleEnum.Values.Owner),
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
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, input.groupId),
          eq(groupMembers.userId, input.userId),
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
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, input.groupId),
          eq(groupMembers.role, GroupRoleEnum.Values.Owner),
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
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, input.groupId),
          eq(groupMembers.userId, userId),
        ),
      )
      .execute();

    // Notify the owner of the group that the user has left
    const group = await db.query.groups.findFirst({
      where: (model, { eq }) => eq(model.id, input.groupId),
    });

    const owner = await db.query.groupMembers.findFirst({
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
          associatedGroupId: input.groupId,
          notificationType: NotificationTypeEnum.Values["Group Member Left"],
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
    const user = ctx.user;

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

    // Check adding the user wouldnt exceed group member limits
    const groupOwnerRow = await db.query.groupMembers
      .findFirst({
        where: (model, { eq, and }) =>
          and(
            eq(model.groupId, inviteCodeRow.groupId),
            eq(model.role, GroupRoleEnum.Values.Owner),
          ),
        with: { user: true },
      })
      .execute();

    const groupOwner = groupOwnerRow?.user;

    if (!groupOwner) {
      throw new Error("Could not find group owner");
    }

    const groupMemberRows = await db.query.groupMembers
      .findMany({
        where: (model, { eq }) => eq(model.groupId, inviteCodeRow.groupId),
      })
      .execute();

    if (
      (groupOwner.plusMembership && groupMemberRows.length >= 101) ||
      (!groupOwner.plusMembership && groupMemberRows.length >= 6)
    ) {
      // Check if the group is full (3 members for free tier, 101 for plus tier)
      throw new Error("Max group size reached");
    }

    // Add the user to the group
    const newGroupMember = await db
      .insert(groupMembers)
      .values({
        groupId: inviteCodeRow.groupId,
        userId: user.id,
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
  .handler(async ({ input, ctx }) => {
    const user = ctx.user;
    const { groupId } = input;

    // Check if the group is full (3 members for free tier, 101 for plus tier)
    const groupMemberRows = await db.query.groupMembers.findMany({
      where: (model, { eq }) => eq(model.groupId, input.groupId),
    });

    if (
      (user.plusMembership && groupMemberRows.length >= 101) ||
      (!user.plusMembership && groupMemberRows.length >= 6)
    ) {
      throw new Error("Max group size reached");
    }

    // Change the role of the user to member from pending
    const member = await db
      .update(groupMembers)
      .set({ role: GroupRoleEnum.Values.Member })
      .where(
        and(
          eq(groupMembers.userId, user.id),
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.role, GroupRoleEnum.Values.Pending),
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
          userId: user.id,
          associatedGroupId: groupId,
          notificationType:
            NotificationTypeEnum.Values["Group Membership Accepted"],
          message: `You have been accepted into ${group?.name}`,
        })
        .execute();

      revalidatePath(`/group/${groupId}`);
      return;
    }

    // Check if the user exists
    const pending = await db.query.groupMembers.findFirst({
      where: (model, { eq }) => eq(model.userId, user.id),
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
    const memberRow = await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.userId, userId),
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.role, GroupRoleEnum.Values.Pending),
        ),
      )
      .returning()
      .execute();

    if (memberRow) {
      // Notify the user that they have been rejected
      const group = await db.query.groups.findFirst({
        where: (model, { eq }) => eq(model.id, groupId),
      });

      await db
        .insert(notifications)
        .values({
          userId: userId,
          associatedGroupId: groupId,
          notificationType:
            NotificationTypeEnum.Values["Group Membership Rejected"],
          message: `You have been rejected from ${group?.name}`,
        })
        .execute();

      revalidatePath(`/group/${groupId}`);
      return;
    }

    // Check if the user exists
    const pendingMemberRow = await db.query.groupMembers.findFirst({
      where: (model, { eq }) => eq(model.userId, userId),
    });

    if (pendingMemberRow)
      throw new Error(
        `Error: User ${pendingMemberRow.userId} has role ${pendingMemberRow.role.toString()}`,
      );
    else throw new Error("User does not exist");
  });

export const createGroupInviteCodeAction = ownsGroupProcedure
  .createServerAction()
  .input(requestGroupInviteCodeFormInputSchema)
  .handler(async ({ input, ctx }) => {
    const user = ctx.user;

    // Check if the group is full (3 members for free tier, 101 for plus tier)
    const groupMemberRows = await db.query.groupMembers.findMany({
      where: (model, { eq }) => eq(model.groupId, input.groupId),
    });

    if (
      (user.plusMembership && groupMemberRows.length >= 101) ||
      (!user.plusMembership && groupMemberRows.length >= 6)
    ) {
      throw new Error("Max group size reached");
    }

    const inviteCode = randomString(8, "#aA");

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
        creatorId: user.id,
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

    const code = `${process.env.URL ? process.env.URL : "sittr.pet"}/join-group/${newInviteCodeRow[0].code}`;

    return { code };
  });
