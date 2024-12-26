import { createServerActionProcedure } from "zsa";
import { db } from "../db";
import { groups, tasks, groupMembers } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "../queries/users";
import { type SelectUser } from "~/lib/schemas/users";
import {
  selectBasicTaskSchema,
  type SelectTask,
  selectTaskSchema,
} from "~/lib/schemas/tasks";
import {
  selectBasicGroupSchema,
  type SelectGroupInput,
  selectGroupSchema,
} from "~/lib/schemas/groups";

export const authenticatedProcedure = createServerActionProcedure().handler(
  async () => {
    const user: SelectUser | undefined = await getLoggedInUser();

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

    const pet = await db.query.pets.findFirst({
      where: (model, { and, eq }) =>
        and(eq(model.id, input.id), eq(model.ownerId, userId)),
    });

    if (!pet) {
      throw new Error("Pet not found");
    }

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

    const task = selectTaskSchema.parse({ ...taskRow });

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
    const task: SelectTask = selectTaskSchema.parse({ ...taskRow.tasks });

    return { userId, task };
  });

export const ownsGroupProcedure = createServerActionProcedure(
  authenticatedProcedure,
)
  .input(selectBasicGroupSchema.pick({ id: true }))
  .handler(async ({ ctx, input }) => {
    const user = ctx.user;
    const userId = ctx.user.id;

    // Check if the user is the owner of the group by left joining group members
    const groupRow = (
      await db
        .select()
        .from(groups)
        .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
        .where(
          and(
            eq(groups.id, input.id),
            eq(groupMembers.userId, userId),
            eq(groupMembers.role, "Owner"),
          ),
        )
    )[0];

    if (!groupRow) {
      throw new Error("Group not found");
    }

    const group: SelectGroupInput = selectGroupSchema.parse({ ...groupRow.groups });

    return { user, group };
  });
