import { createServerActionProcedure } from "zsa";
import { db } from "../db";
import { groups, tasks, groupMembers } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getBasicLoggedInUser } from "../queries/users";
import type { SelectBasicUser } from "~/lib/schemas/users";
import {
  type SelectBasicTask,
  selectBasicTaskSchema,
} from "~/lib/schemas/tasks";
import {
  type SelectBasicGroup,
  selectBasicGroupSchema,
} from "~/lib/schemas/groups";
import { selectBasicPetSchema } from "~/lib/schemas/pets";

export const authenticatedProcedure = createServerActionProcedure().handler(
  async () => {
    const user: SelectBasicUser | undefined = await getBasicLoggedInUser();

    if (!user) {
      // Return to homepage
      redirect("/");
    }

    return { user };
  },
);

export const ownsPetProcedure = createServerActionProcedure(
  authenticatedProcedure,
)
  .input(selectBasicTaskSchema.pick({ id: true }))
  .handler(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    const petRow = await db.query.pets.findFirst({
      where: (model, { and, eq }) =>
        and(eq(model.id, input.id), eq(model.ownerId, userId)),
    });

    if (!petRow) {
      throw new Error("Pet not found");
    }

    const pet = selectBasicPetSchema.parse({ ...petRow });

    return { userId, pet };
  });

export const ownsTaskProcedure = createServerActionProcedure(
  authenticatedProcedure,
)
  .input(selectBasicTaskSchema.pick({ id: true }))
  .handler(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const taskRow = await db.query.tasks.findFirst({
      where: (model, { and, eq }) =>
        and(eq(model.id, input.id), eq(model.creatorId, userId)),
    });

    if (!taskRow) {
      throw new Error("Task not found");
    }

    const task = selectBasicTaskSchema.parse({ ...taskRow });

    return { userId, task };
  });

export const canMarkTaskAsDoneProcedure = createServerActionProcedure(
  authenticatedProcedure,
)
  .input(selectBasicTaskSchema.pick({ id: true }))
  // Check if the user is in the group the task is assigned to
  .handler(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const taskRow = (
      await db
        .select()
        .from(tasks)
        .leftJoin(groups, eq(tasks.groupId, groups.id))
        .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
        .where(and(eq(tasks.id, input.id), eq(groupMembers.userId, userId)))
    )[0];

    if (!taskRow) {
      throw new Error("Task not found");
    }

    // Return just the task part of the row
    const task: SelectBasicTask = selectBasicTaskSchema.parse({
      ...taskRow.tasks,
    });

    return { userId, task };
  });

export const ownsGroupProcedure = createServerActionProcedure(
  authenticatedProcedure,
)
  .input(selectBasicGroupSchema.pick({ id: true }))
  .handler(async ({ ctx, input }) => {
    const user = ctx.user;
    const userId = ctx.user.id;

    // Check if the user is the owner of the group with the given ID
    const groupRow = await db.query.groups.findFirst({
      where: (model, { and, eq }) =>
        and(eq(model.id, input.id), eq(model.ownerId, userId)),
    });

    if (!groupRow) {
      throw new Error("Group not found");
    }

    const group: SelectBasicGroup = selectBasicGroupSchema.parse({
      ...groupRow,
    });

    return { user, group };
  });
