import { z } from "zod";
import { dateRangeSchema, TaskTypeEnum } from ".";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tasks } from "~/server/db/schema";
import { selectPetSchema } from "./pets";
import { selectBasicGroupSchema } from "./groups";
import { selectUserSchema } from "./users";

// -----------------------------------------------------------------------------
// Task Schemas
// -----------------------------------------------------------------------------

export const selectBasicTaskSchema = createSelectSchema(tasks);

export type SelectBasicTask = z.infer<typeof selectBasicTaskSchema>;

export const selectTaskSchema = selectBasicTaskSchema.merge(
  z.object({
    creator: selectUserSchema.optional().nullable(),
    owner: selectUserSchema.optional().nullable(),
    pet: selectPetSchema.optional().nullable(),
    group: selectBasicGroupSchema.optional().nullable(),
    claimedBy: selectUserSchema.optional().nullable(),
    markedAsDoneBy: selectUserSchema.optional().nullable(),
  }),
);

export type SelectTask = z.infer<typeof selectTaskSchema>;

export const insertTaskSchema = createInsertSchema(tasks).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;

export const updateTaskSchema = selectBasicTaskSchema.partial();

export type EditTask = z.infer<typeof updateTaskSchema>;

// -----------------------------------------------------------------------------
// API form schemas
// -----------------------------------------------------------------------------

export const getTaskAPISchema = z
  .object({
    id: z.string().optional().nullable(),
    ids: z.array(z.string()).optional().nullable(),
    dateRange: dateRangeSchema.optional().nullable(),
    type: TaskTypeEnum,
  })
  .refine((data) => data.id ?? data.ids ?? data.dateRange, {
    message:
      "Must provide either id (single), ids (array), or datarange ({from: Date, to: Date})",
  });

export type GetTaskAPI = z.infer<typeof getTaskAPISchema>;

export const toggleTaskMarkedAsDoneInputSchema = z.object({
  id: z.string(),
  markedAsDone: z.boolean(),
});

export type ToggleTaskMarkedAsDoneInput = z.infer<
  typeof toggleTaskMarkedAsDoneInputSchema
>;

// Ideally could just use .partial() but doesn't work for some reason
export const createTaskFormProps = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().min(3).max(500).optional(),
  dueMode: z.boolean().optional(),
  dueDate: z.coerce.date().optional(),
  dateRange: dateRangeSchema.optional(),
  petId: z.string().optional(),
  groupId: z.string().optional(),
});

export type CreateTaskFormProps = z.infer<typeof createTaskFormProps>;

export const setMarkedAsCompleteFormProps = z.object({
  taskId: z.string(),
  markAsDone: z.boolean(),
});

export type SetMarkedAsCompleteFormProps = z.infer<
  typeof setMarkedAsCompleteFormProps
>;

export const setClaimTaskFormProps = z.object({
  taskId: z.string(),
  claim: z.boolean(),
});
