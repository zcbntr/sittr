import { z } from "zod";
import { dateRangeSchema } from ".";

export const taskSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  dueMode: z.boolean(),
  dueDate: z.coerce.date().optional().nullable(),
  dateRange: dateRangeSchema.optional().nullable(),
  petId: z.string().optional(),
  groupId: z.string().optional(),
  requiresVerification: z.boolean().optional().default(false),
  markedAsDone: z.boolean(),
  markedAsDoneBy: z.string().optional().nullable(),
});

export type Task = z.infer<typeof taskSchema>;

export const taskListSchema = z.array(taskSchema);

export type TaskList = z.infer<typeof taskListSchema>;
