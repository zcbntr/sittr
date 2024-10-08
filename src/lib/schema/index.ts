import path from "path";
import { z } from "zod";

const SittingTypeEnum = z.enum(["Pet", "House", "Baby", "Plant"]);
export type SittingTypeEnum = z.infer<typeof SittingTypeEnum>;

const RoleEnum = z.enum(["Owner", "Sitter"]);
export type RoleEnum = z.infer<typeof RoleEnum>;

export const createSittingRequestFormSchema = z
  .object({
    name: z.string().min(3).max(50),
    dateRange: z.object(
      {
        from: z.coerce.date(),
        to: z.coerce.date(),
      },
      {
        required_error: "Please select a date or date range.",
      },
    ),
    sittingType: SittingTypeEnum,
  })
  .refine((data) => data.dateRange.from < data.dateRange.to, {
    path: ["dateRange"],
    message: "From date must be before to date",
  })
  .refine((data) => data.dateRange.from > new Date(), {
    path: ["dateRange"],
    message: "From date must be in the future",
  })
  .refine((data) => data.dateRange.to > new Date(), {
    path: ["dateRange"],
    message: "To date must be in the future",
  });

export type CreateSittingRequestFormInput = z.infer<
  typeof createSittingRequestFormSchema
>;

export const editSittingRequestFormSchema = z
  .object({
    id: z.number(),
    name: z.string().min(3).max(50),
    dateRange: z.object(
      {
        from: z.coerce.date(),
        to: z.coerce.date(),
      },
      {
        required_error: "Please select a date or date range.",
      },
    ),
    sittingType: SittingTypeEnum,
  })
  .refine((data) => data.dateRange.from < data.dateRange.to, {
    path: ["dateRange"],
    message: "From date must be before to date",
  })
  .refine((data) => data.dateRange.from > new Date(), {
    path: ["dateRange"],
    message: "From date must be in the future",
  })
  .refine((data) => data.dateRange.to > new Date(), {
    path: ["dateRange"],
    message: "To date must be in the future",
  });

export type EditSittingRequestFormInput = z.infer<
  typeof editSittingRequestFormSchema
>;

export const deleteSittingRequestFormSchema = z.object({
  id: z.number(),
});

export type DeleteSittingRequestFormInput = z.infer<
  typeof deleteSittingRequestFormSchema
>;

export const createTaskFormSchema = z
  .object({
    name: z.string().min(3).max(50),
    description: z.string().min(3).max(500).optional(),
    dueMode: z.boolean(),
    dueDate: z.coerce.date().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  // Must have either due date or start and end date, but not both
  .refine(
    (data) =>
      data.dueDate ||
      (data.startDate &&
        data.endDate &&
        !(data.dueDate && data.startDate && data.endDate)),
    {
      path: ["dueDate"],
      message: "Due date is required if start and end date are not provided",
    },
  )
  // End date must be after start date
  .refine(
    (data) => data.endDate && data.startDate && data.endDate > data.startDate,
    {
      path: ["endDate"],
      message: "End date must be after start date",
    },
  )
  // Start date must be in the future
  .refine((data) => data.startDate && data.startDate > new Date(), {
    path: ["startDate"],
    message: "Start date must be in the future",
  })
  // End date must be in the future
  .refine((data) => data.endDate && data.endDate > new Date(), {
    path: ["endDate"],
    message: "End date must be in the future",
  })
  // Due date must be in the future
  .refine((data) => data.dueDate && data.dueDate > new Date(), {
    path: ["dueDate"],
    message: "Due date must be in the future",
  });

export type CreateTaskFormInput = z.infer<typeof createTaskFormSchema>;

export const createPetFormSchema = z.object({
  name: z.string().min(3).max(50),
  species: z.string().min(3).max(50),
  breed: z.string().min(3).max(50).optional(),
  birthdate: z.coerce.date(),
});

export type CreatePetFormInput = z.infer<typeof createPetFormSchema>;

export const createGroupFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(50, { message: "Name must be less than 50 characters" }),
  description: z
    .string()
    .max(500, {
      message: "Description must be less than 500 characters",
    })
    .optional(),
  sittingSubjects: z.array(z.number()),
});

export type CreateGroupFormInput = z.infer<typeof createGroupFormSchema>;

export const onboardingPreferencesFormSchema = z.object({
  role: RoleEnum,
  pet: z.boolean(),
  house: z.boolean(),
  baby: z.boolean(),
  plant: z.boolean(),
});
export type OnboardingFormInput = z.infer<
  typeof onboardingPreferencesFormSchema
>;

export const dateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;
