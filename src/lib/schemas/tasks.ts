import { z } from "zod";
import { dateRangeSchema, TaskRepeatitionFrequency, TaskTypeEnum } from ".";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tasks } from "~/server/db/schema";
import { selectPetSchema } from "./pets";
import { selectGroupSchema } from "./groups";
import { selectUserSchema } from "./users";

// -----------------------------------------------------------------------------
// Task Schemas
// -----------------------------------------------------------------------------

export const selectBasicTaskSchema = createSelectSchema(tasks);

export type SelectBasicTask = z.infer<typeof selectBasicTaskSchema>;

export const selectTaskSchema = selectBasicTaskSchema.extend({
  creator: z
    .lazy(() => selectUserSchema)
    .optional()
    .nullable(),
  owner: z
    .lazy(() => selectUserSchema)
    .optional()
    .nullable(),
  pet: z
    .lazy(() => selectPetSchema)
    .optional()
    .nullable(),
  group: z
    .lazy(() => selectGroupSchema)
    .optional()
    .nullable(),
  claimedBy: z
    .lazy(() => selectUserSchema)
    .optional()
    .nullable(),
  markedAsDoneBy: z
    .lazy(() => selectUserSchema)
    .optional()
    .nullable(),
});

// May need to be defined before the schema if anything breaks
export type SelectTask = z.infer<typeof selectTaskSchema>;

export const createTaskSchema = createInsertSchema(tasks)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    ownerId: true,
    creatorId: true,
    claimedAt: true,
    claimedById: true,
    completedAt: true,
    markedAsDoneAt: true,
    markedAsDoneById: true,
  })
  .extend({
    name: z
      .string()
      .min(5, { message: "Please provide a title for your task" })
      .max(50, { message: "Title should be 50 characters or less" }),
    description: z
      .string()
      .min(15, {
        message: "Please describe the task in detail to help your sitters",
      })
      .max(500, { message: "Description should not exceed 500 characters" })
      .optional(),
    groupId: z
      .string()
      .nonempty({ message: "Provide a group to assign the group to" }),
    dueDate: z.coerce
      .date()
      .min(new Date(), { message: "Date must be in the future" })
      .optional(),
    dateRangeFrom: z
      .date()
      .min(new Date(), { message: "Date must be in the future" })
      .optional(),
    dateRangeTo: z
      .date()
      .min(new Date(), { message: "Date must be in the future" })
      .optional(),
    petId: z.string().nonempty({ message: "Provide the pet the task serves" }),
    repeatFrequency: TaskRepeatitionFrequency.optional(),
    repeatUntil: z.date().optional(),
  })
  .refine((data) => !data.dueMode || (data.dueMode && data.dueDate), {
    message: "Due date is required for tasks set to due mode",
    path: ["dueDate"],
  })
  .refine((data) => data.dueMode ?? (!data.dueMode && data.dateRangeFrom), {
    message: "From date is required for tasks that span a time period",
    path: ["dateRangeFrom"],
  })
  .refine((data) => data.dueMode ?? (!data.dueMode && data.dateRangeFrom), {
    message: "From date is required for tasks that span a time period",
    path: ["dateRangeTo"],
  })
  .refine(
    (data) =>
      (data.repeatFrequency && data.repeatUntil) ??
      (!data.repeatFrequency && !data.repeatUntil),
    {
      message:
        "Repeating tasks require both repeat frequency and repeat until date",
      path: ["repeatFrequency", "repeatUntil"],
    },
  );

export type NewTask = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = selectBasicTaskSchema
  .partial()
  .omit({
    createdAt: true,
    updatedAt: true,
    ownerId: true,
    creatorId: true,
    claimedAt: true,
    claimedById: true,
    completedAt: true,
    markedAsDoneAt: true,
    markedAsDoneById: true,
  })
  .extend({
    name: z
      .string()
      .min(5, { message: "Please provide a title for your task" })
      .max(50, { message: "Title should be 50 characters or less" }),
    description: z
      .string()
      .min(15, {
        message: "Please describe the task in detail to help your sitters",
      })
      .max(500, { message: "Description should not exceed 500 characters" })
      .optional(),
    groupId: z
      .string()
      .nonempty({ message: "Provide a group to assign the group to" }),
    dueDate: z.coerce
      .date()
      .min(new Date(), { message: "Date must be in the future" })
      .optional(),
    dateRangeFrom: z
      .date()
      .min(new Date(), { message: "Date must be in the future" })
      .optional(),
    dateRangeTo: z
      .date()
      .min(new Date(), { message: "Date must be in the future" })
      .optional(),
    petId: z.string().nonempty({ message: "Provide the pet the task serves" }),
    repeatFrequency: TaskRepeatitionFrequency.optional(),
    repeatUntil: z.date().optional(),
  })
  .refine((data) => !data.dueMode || (data.dueMode && data.dueDate), {
    message: "Due date is required for tasks set to due mode",
    path: ["dueDate"],
  })
  .refine((data) => data.dueMode ?? (!data.dueMode && data.dateRangeFrom), {
    message: "From date is required for tasks that span a time period",
    path: ["dateRangeFrom"],
  })
  .refine((data) => data.dueMode ?? (!data.dueMode && data.dateRangeFrom), {
    message: "From date is required for tasks that span a time period",
    path: ["dateRangeTo"],
  })
  .refine(
    (data) =>
      (data.repeatFrequency && data.repeatUntil) ??
      (!data.repeatFrequency && !data.repeatUntil),
    {
      message:
        "Repeating tasks require both repeat frequency and repeat until date",
      path: ["repeatFrequency", "repeatUntil"],
    },
  );

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
  dateRange: dateRangeSchema.optional(),
  petId: z.string().optional(),
  groupId: z.string().optional(),
  dueDate: z.coerce
    .date()
    .min(new Date(), { message: "Date must be in the future" })
    .optional(),
  dateRangeFrom: z
    .date()
    .min(new Date(), { message: "Date must be in the future" })
    .optional(),
  dateRangeTo: z
    .date()
    .min(new Date(), { message: "Date must be in the future" })
    .optional(),
});

export type CreateTaskFormProps = z.infer<typeof createTaskFormProps>;

export const setMarkedAsCompleteFormProps = z.object({
  id: z.string(),
  markAsDone: z.boolean(),
});

export type SetMarkedAsCompleteFormProps = z.infer<
  typeof setMarkedAsCompleteFormProps
>;

export const setClaimTaskFormProps = z.object({
  id: z.string(),
  claim: z.boolean(),
});
