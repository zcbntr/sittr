import { z } from "zod";

// -----------------------------------------------------------------------------
// General schemas and client side shit
// -----------------------------------------------------------------------------

export const dateRangeSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((data) => data.to > data.from, {
    message: "to must be after from",
  })
  .refine((data) => data.to > new Date("1900-01-01"), {
    message: "to must be after 1900-01-01",
  })
  .refine((data) => data.from > new Date("1900-01-01"), {
    message: "from must be after 1900-01-01",
  });

export type DateRange = z.infer<typeof dateRangeSchema>;

export const TaskTypeEnum = z.enum([
  "All",
  "Sitting For",
  "Owned",
  "Unclaimed",
]);
export type TaskTypeEnum = z.infer<typeof TaskTypeEnum>;

export const TaskRepeatitionFrequency = z.enum(["Daily", "Weekly", "Monthly"]);
export type TaskRepeatitionFrequency = z.infer<typeof TaskRepeatitionFrequency>;

export const GroupRoleEnum = z.enum(["Owner", "Member", "Pending"]);
export type GroupRoleEnum = z.infer<typeof GroupRoleEnum>;

export const SexEnum = z.enum(["Male", "Female", "Unspecified"]);
export type SexEnum = z.infer<typeof SexEnum>;

export const NotificationTypeEnum = z.enum([
  "Overdue Task",
  "Upcoming Unclaimed Task",
  "Completed Task",
  "Pet Birthday",
  "Group Member Of Deleted",
  "Pet Added To Group",
  "Group Member Left",
  "Group Membership Accepted",
  "Group Membership Rejected",
]);
export type NotificationTypeEnum = z.infer<typeof NotificationTypeEnum>;

// -----------------------------------------------------------------------------
// API form schemas
// -----------------------------------------------------------------------------

export const basicGetAPIFormSchema = z
  .object({
    id: z.string().optional().nullable(),
    ids: z.array(z.string()).optional().nullable(),
    all: z.boolean().optional().nullable(),
  })
  // Ensure that either ids or all is provided
  .refine((data) => data.id ?? data.ids ?? data.all, {
    message: "Must provide either id (single), ids (array), or all (boolean)",
  })
  // Ensure that ids is not empty if provided
  .refine((data) => !data.ids || data.ids.length > 0, {
    message: "Ids must not be empty",
  });

export type BasicGetAPIFormSchema = z.infer<typeof basicGetAPIFormSchema>;
