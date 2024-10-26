import { z } from "zod";

// -----------------------------------------------------------------------------
// General schemas
// -----------------------------------------------------------------------------

export const RoleEnum = z.enum(["Owner", "Sitter"]);
export type RoleEnum = z.infer<typeof RoleEnum>;

export const GroupRoleEnum = z.enum(["Owner", "Member", "Pending"]);
export type GroupRoleEnum = z.infer<typeof GroupRoleEnum>;

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
    petId: z.string(),
    groupId: z.string().optional(),
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
  petId: z.string().optional(),
  groupId: z.string().optional(),
});

export type CreateTaskFormProps = z.infer<typeof createTaskFormProps>;

export const createPetFormSchema = z
  .object({
    name: z.string().min(3).max(50),
    species: z.string().min(3).max(50),
    breed: z.string().min(3).max(50).optional(),
    dob: z.coerce.date(),
  })
  .refine((data) => data.dob < new Date(), {
    message: "Birthdate must be in the past",
  })
  .refine((data) => data.dob > new Date("1900-01-01"), {
    message: "Birthdate must be after 1900-01-01",
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
  petIds: z.array(z.string()),
});

export type CreateGroupFormInput = z.infer<typeof createGroupFormSchema>;

export const requestGroupInviteCodeFormInputSchema = z.object({
  groupId: z.string(),
  maxUses: z.number(),
  expiresAt: z.coerce.date(),
  requiresApproval: z.boolean(),
});

export type RequestGroupInviteCodeFormInput = z.infer<
  typeof requestGroupInviteCodeFormInputSchema
>;

export const petToGroupFormInputSchema = z.object({
  petId: z.string(),
  groupId: z.string(),
});

export type petToGroupFormInput = z.infer<typeof petToGroupFormInputSchema>;

export const petsToGroupFormInputSchema = z.object({
  petIds: z.array(z.string()),
  groupId: z.string(),
});

export type PetsToGroupFormInput = z.infer<typeof petsToGroupFormInputSchema>;

export const userGroupPairSchema = z.object({
  userId: z.string(),
  groupId: z.string(),
});

export type UserGroupPair = z.infer<typeof userGroupPairSchema>;

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

// -----------------------------------------------------------------------------
// Response schemas - no refine methods - we trust the db
// -----------------------------------------------------------------------------

export const petSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.string().optional(),
  dob: z.coerce.date(),
});

export type Pet = z.infer<typeof petSchema>;

export const petListSchema = z.array(petSchema);

export type PetList = z.infer<typeof petListSchema>;

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

export const userToGroupSchema = z.object({
  id: z.string(),
  userId: z.string(),
  groupId: z.string(),
  role: GroupRoleEnum,
});

export type UserToGroup = z.infer<typeof userToGroupSchema>;

export const groupInviteCodeSchema = z.object({
  id: z.string(),
  createdBy: z.string(),
  code: z.string(),
  groupId: z.string(),
  uses: z.number(),
  maxUses: z.number(),
  expiresAt: z.coerce.date(),
  requiresApproval: z.boolean(),
});

export type GroupInviteCode = z.infer<typeof groupInviteCodeSchema>;

export const petToGroupSchema = z.object({
  id: z.string(),
  petId: z.string(),
  groupId: z.string(),
});

export type PetToGroup = z.infer<typeof petToGroupSchema>;

export const petToGroupListSchema = z.array(petToGroupSchema);

export type PetToGroupList = z.infer<typeof petToGroupListSchema>;

export const groupPetSchema = z.object({
  id: z.string(),
  petId: z.string(),
  ownerId: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.string().optional(),
  dob: z.coerce.date(),
  groupId: z.string(),
});

export type GroupPet = z.infer<typeof groupPetSchema>;

export const groupPetListSchema = z.array(groupPetSchema);

export type GroupPetList = z.infer<typeof groupPetListSchema>;

export const user = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
});

export type User = z.infer<typeof user>;

export const groupMemberSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  userId: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  role: GroupRoleEnum,
});

export type GroupMember = z.infer<typeof groupMemberSchema>;

export const groupMemberListSchema = z.array(groupMemberSchema);

export type GroupMemberList = z.infer<typeof groupMemberListSchema>;

export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  members: z.array(groupMemberSchema).optional(),
  pets: z.array(petSchema).optional(),
});

export type Group = z.infer<typeof groupSchema>;

export const groupListSchema = z.array(groupSchema);

export type GroupList = z.infer<typeof groupListSchema>;
