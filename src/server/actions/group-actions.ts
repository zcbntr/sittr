"use server";

import {
  createGroupInputSchema,
  groupSchema,
  RoleEnum,
} from "~/lib/schemas/groups";
import { db } from "../db";
import { authenticatedProcedure, ownsGroupProcedure } from "./zsa-procedures";
import { groups, petsToGroups, usersToGroups } from "../db/schema";
import { eq } from "drizzle-orm";

export const createGroupAction = authenticatedProcedure
  .createServerAction()
  .input(createGroupInputSchema)
  .handler(async ({ input, ctx }) => {
    const { user } = ctx;

    // Create group, add user to groupMembers, add pets to group, all in a transaction
    await db.transaction(async (db) => {
      // Create group
      const newGroup = await db
        .insert(groups)
        .values({
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
  });

export const updateGroupDetailsAction = ownsGroupProcedure
  .createServerAction()
  .input(groupSchema.pick({ id: true, name: true, description: true }))
  .handler(async ({ input }) => {
    await db
      .update(groups)
      .set({
        name: input.name,
        description: input.description,
      })
      .where(eq(groups.id, input.id))
      .execute();
  });

export const deleteGroupAction = ownsGroupProcedure
  .createServerAction()
  .input(groupSchema.pick({ id: true }))
  .handler(async ({ input }) => {
    await db.delete(groups).where(eq(groups.id, input.id)).execute();
  });
