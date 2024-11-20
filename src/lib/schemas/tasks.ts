import { z } from "zod";
import { dateRangeSchema } from ".";

// -----------------------------------------------------------------------------
// Task Schemas
// -----------------------------------------------------------------------------

export const taskSchema = z.object({
  taskId: z.string(),
  ownerId: z.string(),
  createdBy: z.string(),
  name: z.string(),
  description: z.string().optional(),
  dueMode: z.boolean(),
  dueDate: z.coerce.date().optional().nullable(),
  dateRange: dateRangeSchema.optional().nullable(),
  petId: z.string(),
  groupId: z.string(),
  requiresVerification: z.boolean().optional().default(false),
  markedAsDone: z.boolean(),
  markedAsDoneBy: z.string().optional().nullable(),
  claimed: z.boolean(),
  claimedBy: z.string().optional().nullable(),
});

export type Task = z.infer<typeof taskSchema>;

export const taskListSchema = z.array(taskSchema);

export type TaskList = z.infer<typeof taskListSchema>;

// -----------------------------------------------------------------------------
// API form schemas
// -----------------------------------------------------------------------------

export const TaskTypeEnum = z.enum([
  "All",
  "Sitting For",
  "Owned",
  "Unclaimed",
]);
export type TaskTypeEnum = z.infer<typeof TaskTypeEnum>;

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

// Fix constraints - they have been removed so tasks can be created - for some reason the create task dialog was not working with the constraints
export const createTaskInputSchema = z
  .object({
    name: z.string().min(3).max(50),
    description: z.string().min(3).max(500).optional(),
    dueMode: z.boolean(),
    dueDate: z.coerce.date().optional(),
    dateRange: dateRangeSchema.optional(),
    petId: z.string(),
    groupId: z.string(),
  })
  // Must have either due date or start and end date
  .refine(
    (data) =>
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (data.dueMode && data.dueDate) ||
      (!data.dueMode && data.dateRange !== undefined),
    {
      path: ["dueDate"],
      message: "dueDate is required if dateRange is not provided",
    },
  )
  // End date must be after start date
  .refine(
    (data) =>
      !data.dueMode &&
      data.dateRange &&
      data.dateRange.to > data.dateRange.from,
    {
      path: ["dateRange"],
      message: "dateRange.to must be after dateRange.from",
    },
  )
  // Start date must be in the future
  .refine(
    (data) =>
      !data.dueMode && data.dateRange && data.dateRange.from > new Date(),
    {
      path: ["dateRange"],
      message: "dateRange.from must be in the future",
    },
  )
  // To date must be in the future
  .refine(
    (data) => !data.dueMode && data.dateRange && data.dateRange.to > new Date(),
    {
      path: ["dateRange"],
      message: "dateRange.to must be in the future",
    },
  )
  // Due date must be in the future
  .refine(
    (data) =>
      !data.dueMode ||
      (data.dueMode && data.dueDate && data.dueDate > new Date()),
    {
      path: ["dueDate"],
      message: "dueDate must be in the future",
    },
  );

export type CreateTask = z.infer<typeof createTaskInputSchema>;

export const toggleTaskMarkedAsDoneInputSchema = z.object({
  id: z.string(),
  markedAsDone: z.boolean(),
});

export type ToggleTaskMarkedAsDoneInput = z.infer<
  typeof toggleTaskMarkedAsDoneInputSchema
>;

// Probably can all be dropped now
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
  markedAsDone: z.boolean(),
});

export type SetMarkedAsCompleteFormProps = z.infer<
  typeof setMarkedAsCompleteFormProps
>;

export const setClaimTaskFormProps = z.object({
  taskId: z.string(),
  claimed: z.boolean(),
});

export type SetClaimTaskFormProps = z.infer<typeof setClaimTaskFormProps>;
