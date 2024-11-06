import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerActionProcedure } from "zsa";
import { db } from "../db";
import { groups, pets, petsToGroups, tasks, usersToGroups } from "../db/schema";
import { and, eq, or } from "drizzle-orm";

export const authenticatedProcedure = createServerActionProcedure().handler(
  async () => {
    const user = await auth();
    if (!user.userId) {
      redirect("/login");
    }

    return { user };
  },
);

export const ownsPetProcedure = createServerActionProcedure(
  authenticatedProcedure,
)
  .input(z.object({ petId: z.string() }))
  .handler(async ({ ctx, input }) => {
    const { user } = ctx;
    const pet = await db.query.pets.findFirst({
      where: (model, { and, eq }) =>
        and(eq(model.id, input.petId), eq(model.ownerId, user.userId)),
    });

    if (!pet) {
      throw new Error("Pet not found");
    }

    return { user, pet };
  });

// export const canViewPetProcedure = createServerActionProcedure(
//   authenticatedProcedure,
// )
//   .input(z.object({ petId: z.string() }))
//   // User must be the owner of the pet or in a group which sits for the pet
//   .handler(async ({ ctx, input }) => {
//     const { user } = ctx;
//     const pet = (
//       await db
//         .select()
//         .from(pets)
//         .leftJoin(petsToGroups, eq(pets.id, petsToGroups.petId))
//         .leftJoin(groups, eq(petsToGroups.groupId, groups.id))
//         .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
//         .where(
//           or(
//             and(
//               eq(usersToGroups.userId, user.userId),
//               eq(pets.id, input.petId),
//             ),
//             eq(pets.ownerId, user.userId),
//           ),
//         )
//     )[0]?.pets;

//     if (!pet) {
//       throw new Error("Pet not found");
//     }

//     return { user, pet };
//   });

export const ownsTaskProcedure = createServerActionProcedure(
  authenticatedProcedure,
)
  .input(z.object({ taskId: z.string() }))
  .handler(async ({ ctx, input }) => {
    const { user } = ctx;
    const task = await db.query.tasks.findFirst({
      where: (model, { and, eq }) =>
        and(eq(model.id, input.taskId), eq(model.ownerId, user.userId)),
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return { user, task };
  });

export const canMarkTaskAsDoneProcedure = createServerActionProcedure(
  authenticatedProcedure,
)
  .input(z.object({ taskId: z.string() }))
  // Check if the user is in the group the task is assigned to
  .handler(async ({ ctx, input }) => {
    const { user } = ctx;
    const taskRow = (
      await db
        .select()
        .from(tasks)
        .leftJoin(groups, eq(tasks.pet, groups.id))
        .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
        .where(
          and(
            eq(tasks.id, input.taskId),
            eq(usersToGroups.userId, user.userId),
          ),
        )
    )[0];

    if (!taskRow) {
      throw new Error("Task not found");
    }

    // Return just the task part of the row
    const task = taskRow.tasks;

    return { user, task };
  });

export const ownsGroupProcedure = createServerActionProcedure(
  authenticatedProcedure,
)
  .input(z.object({ groupId: z.string() }))
  .handler(async ({ ctx, input }) => {
    const { user } = ctx;

    // Check if the user is the owner of the group by left joining group members
    const groupRow = (
      await db
        .select()
        .from(groups)
        .leftJoin(usersToGroups, eq(groups.id, usersToGroups.groupId))
        .where(
          and(
            eq(groups.id, input.groupId),
            eq(usersToGroups.userId, user.userId),
            eq(usersToGroups.role, "Owner"),
          ),
        )
    )[0];

    if (!groupRow) {
      throw new Error("Group not found");
    }

    const group = groupRow.groups;

    return { user, group };
  });
