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
// Form schemas
// -----------------------------------------------------------------------------

export const createTaskSchema = z
  .object({
    name: z.string().min(3).max(50),
    description: z.string().min(3).max(500).optional(),
    dueMode: z.boolean(),
    dueDate: z.coerce.date().optional(),
    dateRange: dateRangeSchema.optional(),
    subjectId: z.number(),
    groupId: z.number().optional(),
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

export type CreateTask = z.infer<typeof createTaskSchema>;

// Ideally could just use .partial() but doesn't work for some reason
export const createTaskFormProps = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().min(3).max(500).optional(),
  dueMode: z.boolean().optional(),
  dueDate: z.coerce.date().optional(),
  dateRange: dateRangeSchema.optional(),
  subjectId: z.number().optional(),
  groupId: z.number().optional(),
});

export type CreateTaskFormProps = z.infer<typeof createTaskFormProps>;

export const createPetFormSchema = z
  .object({
    name: z.string().min(3).max(50),
    species: z.string().min(3).max(50),
    breed: z.string().min(3).max(50).optional(),
    birthdate: z.coerce.date(),
  })
  .refine((data) => data.birthdate < new Date(), {
    message: "Birthdate must be in the past",
  })
  .refine((data) => data.birthdate > new Date("1900-01-01"), {
    message: "Birthdate must be after 1900-01-01",
  });

export type CreatePetFormInput = z.infer<typeof createPetFormSchema>;

export const createHouseFormSchema = z.object({
  name: z.string().min(3).max(50),
  address: z.string().min(5).max(150).optional(),
});

export type CreateHouseFormInput = z.infer<typeof createHouseFormSchema>;

export const createPlantFormSchema = z
  .object({
    name: z.string().min(3).max(50),
    species: z.string().min(3).max(50).optional(),
    lastWatered: z.coerce.date().optional(),
    wateringFrequency: WateringFrequency,
  })
  .refine(
    (data) => data.lastWatered == undefined || data.lastWatered < new Date(),
    {
      message: "Last watered must be in the past",
    },
  );

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

export const requestGroupInviteCodeFormInput = z.object({
  groupId: z.number(),
  maxUses: z.number(),
  expiresAt: z.coerce.date(),
  requiresApproval: z.boolean(),
});

export type RequestGroupInviteCodeFormInput = z.infer<
  typeof requestGroupInviteCodeFormInput
>;

export const onboardingPreferencesFormSchema = z.object({
  pet: z.boolean(),
  house: z.boolean(),
  baby: z.boolean(),
  plant: z.boolean(),
});

export type OnboardingFormInput = z.infer<
  typeof onboardingPreferencesFormSchema
>;

// -----------------------------------------------------------------------------
// API form schemas
// -----------------------------------------------------------------------------

export const basicGetAPIFormSchema = z
  .object({
    id: z.number().optional().nullable(),
    ids: z.array(z.number()).optional().nullable(),
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
    id: z.number().optional().nullable(),
    ids: z.array(z.number()).optional().nullable(),
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
  id: z.number(),
});

export type DeleteAPIFormInput = z.infer<typeof deleteAPIFormSchema>;

// -----------------------------------------------------------------------------
// Response schemas - no refine methods - we trust the db
// -----------------------------------------------------------------------------

export const sittingPreferencesSchema = z.object({
  userId: z.string(),
  pet: z.boolean(),
  house: z.boolean(),
  baby: z.boolean(),
  plant: z.boolean(),
});

export type SittingPreferences = z.infer<typeof sittingPreferencesSchema>;

export const ownerPreferencesSchema = z.object({
  userId: z.string(),
  pet: z.boolean(),
  house: z.boolean(),
  baby: z.boolean(),
  plant: z.boolean(),
});

export type OwnerPreferences = z.infer<typeof ownerPreferencesSchema>;

export const petSchema = z.object({
  id: z.number(),
  subjectId: z.number(),
  name: z.string(),
  species: z.string(),
  breed: z.string().optional().nullable(),
  dob: z.coerce.date(),
});

export type Pet = z.infer<typeof petSchema>;

export const houseSchema = z.object({
  id: z.number(),
  subjectId: z.number(),
  name: z.string(),
  address: z.string().optional().nullable(),
});

export type House = z.infer<typeof houseSchema>;

export const plantSchema = z.object({
  id: z.number(),
  subjectId: z.number(),
  name: z.string(),
  species: z.string().optional().nullable(),
  lastWatered: z.coerce.date().optional().nullable(),
  wateringFrequency: WateringFrequency,
});

export type Plant = z.infer<typeof plantSchema>;

export const sittingSubjectSchema = z.union([
  petSchema,
  houseSchema,
  plantSchema,
]);

export type SittingSubject = z.infer<typeof sittingSubjectSchema>;

export const taskSchema = z.object({
  id: z.number(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  dueMode: z.boolean(),
  dueDate: z.coerce.date().optional().nullable(),
  dateRange: dateRangeSchema.optional().nullable(),
  subjectId: z.number(),
  groupId: z.number().optional().nullable(),
  requiresVerification: z.boolean().optional().nullable(),
  markedAsDone: z.boolean(),
  markedAsDoneBy: z.string().optional().nullable(),
});

export type Task = z.infer<typeof taskSchema>;

export const groupMemberSchema = z.object({
  id: z.number(),
  userId: z.string(),
  groupId: z.number(),
  role: GroupRoleEnum,
});

export type GroupMember = z.infer<typeof groupMemberSchema>;

export const groupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  members: z.array(groupMemberSchema),
  sittingSubjectIds: z.array(z.number()),
});

export type Group = z.infer<typeof groupSchema>;

export const groupInviteCodeSchema = z.object({
  id: z.number(),
  code: z.string(),
  groupId: z.number(),
  uses: z.number(),
  maxUses: z.number(),
  expiresAt: z.coerce.date(),
  requiresApproval: z.boolean(),
});

export type GroupInviteCode = z.infer<typeof groupInviteCodeSchema>;
