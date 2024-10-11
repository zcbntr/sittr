import path from "path";
import { z } from "zod";

// -----------------------------------------------------------------------------
// General schemas
// -----------------------------------------------------------------------------

export const SittingTypeEnum = z.enum(["Pet", "House", "Baby", "Plant"]);
export type SittingTypeEnum = z.infer<typeof SittingTypeEnum>;

export const RoleEnum = z.enum(["Owner", "Sitter"]);
export type RoleEnum = z.infer<typeof RoleEnum>;

export const GroupRoleEnum = z.enum(["Owner", "Member", "Pending"]);
export type GroupRoleEnum = z.infer<typeof GroupRoleEnum>;

export const WateringFrequency = z.enum([
  "Daily",
  "Weekly",
  "Biweekly",
  "Monthly",
]);
export type WateringFrequency = z.infer<typeof WateringFrequency>;

// -----------------------------------------------------------------------------
// Form schemas
// -----------------------------------------------------------------------------

export const dateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;

export const createSittingRequestFormSchema = z
  .object({
    name: z.string().min(3).max(50),
    dateRange: dateRangeSchema,
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
    dateRange: dateRangeSchema.optional(),
  })
  // Must have either due date or start and end date, but not both
  .refine(
    (data) =>
      (data.dueMode && data.dueDate && !data.dateRange) ||
      (!data.dueMode && !data.dueDate && data.dateRange),
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
  .refine((data) => data.dueMode && data.dueDate && data.dueDate > new Date(), {
    path: ["dueDate"],
    message: "dueDate must be in the future",
  });

export type CreateTaskFormInput = z.infer<typeof createTaskFormSchema>;

export const createPetFormSchema = z.object({
  name: z.string().min(3).max(50),
  species: z.string().min(3).max(50),
  breed: z.string().min(3).max(50).optional(),
  birthdate: z.coerce.date(),
});

export type CreatePetFormInput = z.infer<typeof createPetFormSchema>;

export const createHouseFormSchema = z.object({
  name: z.string().min(3).max(50),
  address: z.string().min(3).max(50).optional(),
});

export type CreateHouseFormInput = z.infer<typeof createHouseFormSchema>;

export const createPlantFormSchema = z.object({
  name: z.string().min(3).max(50),
  species: z.string().min(3).max(50).optional(),
  lastWatered: z.coerce.date().optional(),
  wateringFrequency: WateringFrequency,
});

export type CreatePlantFormInput = z.infer<typeof createPlantFormSchema>;

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

export const basicGetAPIFormSchema = z
  .object({
    ids: z.array(z.number()).optional().nullable(),
    all: z.boolean().optional().nullable(),
  })
  // Ensure that either ids or all is provided
  .refine((data) => data.ids ?? data.all, {
    message: "Must provide either ids or all",
  })
  // Ensure that ids is not empty if provided
  .refine((data) => !data.ids || data.ids.length > 0, {
    message: "Ids must not be empty",
  });

export type BasicGetAPIFormSchema = z.infer<typeof basicGetAPIFormSchema>;

// -----------------------------------------------------------------------------
// Response schemas
// -----------------------------------------------------------------------------

export const petSchema = z.object({
  id: z.number(),
  subjectId: z.number().optional().nullable(),
  name: z.string(),
  species: z.string(),
  breed: z.string().optional().nullable(),
  dob: z.date(),
});

export type Pet = z.infer<typeof petSchema>;

export const houseSchema = z.object({
  id: z.number(),
  subjectId: z.number().optional().nullable(),
  name: z.string(),
  address: z.string().optional().nullable(),
});

export type House = z.infer<typeof houseSchema>;

export const plantSchema = z.object({
  id: z.number(),
  subjectId: z.number().optional().nullable(),
  name: z.string(),
  species: z.string().optional().nullable(),
  lastWatered: z.date().optional().nullable(),
  wateringFrequency: WateringFrequency,
});

export type Plant = z.infer<typeof plantSchema>;

export const sittingSubjectSchema = z.union([
  petSchema,
  houseSchema,
  plantSchema,
]);

export type SittingSubject = z.infer<typeof sittingSubjectSchema>;
