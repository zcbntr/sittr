import { z } from "zod";

// -----------------------------------------------------------------------------
// General schemas
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

export const basicGetAPIFormSchemaWithDateRange = z
  .object({
    id: z.string().optional().nullable(),
    ids: z.array(z.string()).optional().nullable(),
    all: z.boolean().optional().nullable(),
    dateRange: dateRangeSchema.optional().nullable(),
  })
  // Ensure that either ids or all is provided
  .refine((data) => data.id ?? data.ids ?? data.all, {
    message: "Must provide either id (single), ids (array), or all (boolean)",
  })
  // Ensure that ids is not empty if provided
  .refine((data) => !data.ids || data.ids.length > 0, {
    message: "Ids must not be empty",
  });

export type BasicGetAPIFormSchemaWithDateRange = z.infer<
  typeof basicGetAPIFormSchemaWithDateRange
>;

export const deleteAPIFormSchema = z.object({
  id: z.string(),
});

export type DeleteAPIFormInput = z.infer<typeof deleteAPIFormSchema>;

export const idList = z.object({
  ids: z.array(z.string()),
});

export type IdList = z.infer<typeof idList>;