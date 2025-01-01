import { z } from "zod";
import {
  groupInviteCodes,
  groupMembers,
  groups,
  petsToGroups,
} from "~/server/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  type SelectUserInput,
  type SelectUserOutput,
  selectUserSchema,
} from "./users";
import {
  type SelectPetInput,
  type SelectPetOutput,
  selectPetSchema,
} from "./pets";

// -----------------------------------------------------------------------------
// Group Schemas
// -----------------------------------------------------------------------------

export const DurationEnum = z.enum([
  "24 Hours",
  "48 Hours",
  "1 Week",
  "1 Month",
]);
export type DurationEnum = z.infer<typeof DurationEnum>;

export const selectBasicGroupMemberSchema = createSelectSchema(groupMembers);

export type SelectBasicGroupMember = z.infer<
  typeof selectBasicGroupMemberSchema
>;

export const selectBasicGroupSchema = createSelectSchema(groups);

export type SelectBasicGroup = z.infer<typeof selectBasicGroupSchema>;

export type SelectGroupMemberInput = z.input<
  typeof selectBasicGroupMemberSchema
> & {
  user?: SelectUserInput | undefined;
  group?: SelectGroupInput | undefined;
};

export type SelectGroupMemberOutput = z.output<
  typeof selectBasicGroupMemberSchema
> & {
  user?: SelectUserOutput | undefined;
  group?: SelectGroupOutput | undefined;
};

export const selectGroupMemberSchema: z.ZodType<
  SelectGroupMemberInput,
  z.ZodTypeDef,
  SelectGroupMemberOutput
> = selectBasicGroupMemberSchema.extend({
  user: z.lazy(() => selectUserSchema).optional(),
  group: z.lazy(() => selectGroupSchema).optional(),
});

export type SelectGroupMember = z.infer<typeof selectGroupMemberSchema>;

export type SelectGroupInput = z.input<typeof selectBasicGroupSchema> & {
  creator?: SelectUserInput | undefined;
  members?: SelectGroupMemberInput[] | undefined;
  petsToGroups?: SelectPetToGroupInput[] | undefined;
};

export type SelectGroupOutput = z.output<typeof selectBasicGroupSchema> & {
  creator?: SelectUserOutput | undefined;
  members?: SelectGroupMemberOutput[] | undefined;
  petsToGroups?: SelectPetToGroupOutput[] | undefined;
};

export const selectGroupSchema: z.ZodType<
  SelectGroupInput,
  z.ZodTypeDef,
  SelectGroupOutput
> = selectBasicGroupSchema.extend({
  creator: z.lazy(() => selectUserSchema).optional(),
  members: z
    .lazy(() => selectGroupMemberSchema)
    .array()
    .optional(),
  petsToGroups: z
    .lazy(() => selectPetToGroupSchema)
    .array()
    .optional(),
});

export type SelectGroup = z.infer<typeof selectGroupSchema>;

export const createGroupSchema = createInsertSchema(groups)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    creatorId: true,
    ownerId: true,
  })
  .extend({
    name: z
      .string()
      .min(1, { message: "Your group must have a name" })
      .max(50, { message: "Group names must be 50 characters or less" }),
    description: z
      .string()
      .min(10, {
        message: "Please describe the purpose of your group to members",
      })
      .max(500, { message: "Description must be 500 characters or less" }),
    petIds: z.string().array().optional(),
  });

export type NewGroup = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = createSelectSchema(groups).partial();

export type EditGroup = z.infer<typeof updateGroupSchema>;

export const selectGroupInviteCodeSchema = createSelectSchema(groupInviteCodes);

export type SelectGroupInviteCode = z.infer<typeof selectGroupInviteCodeSchema>;

export const insertGroupInviteCodeSchema = createInsertSchema(groupInviteCodes);

export type NewGroupInviteCode = z.infer<typeof insertGroupInviteCodeSchema>;

export const updateGroupInviteCodeSchema =
  createSelectSchema(groupInviteCodes).partial();

export type EditGroupInviteCode = z.infer<typeof updateGroupInviteCodeSchema>;

export const selectBasicPetToGroupSchema = createSelectSchema(petsToGroups);

export type SelectBasicPetToGroup = z.infer<typeof selectBasicPetToGroupSchema>;

export type SelectPetToGroupInput = z.input<
  typeof selectBasicPetToGroupSchema
> & {
  pet?: SelectPetInput | undefined;
  group?: SelectGroupInput | undefined;
};

export type SelectPetToGroupOutput = z.output<
  typeof selectBasicPetToGroupSchema
> & {
  pet?: SelectPetOutput | undefined;
  group?: SelectGroupOutput | undefined;
};

export const selectPetToGroupSchema: z.ZodType<
  SelectPetToGroupInput,
  z.ZodTypeDef,
  SelectPetToGroupOutput
> = selectBasicPetToGroupSchema.extend({
  pet: z.lazy(() => selectPetSchema).optional(),
  group: z.lazy(() => selectGroupSchema).optional(),
});

export type SelectPetToGroup = z.infer<typeof selectPetToGroupSchema>;

export const insertPetToGroupSchema = createInsertSchema(petsToGroups);

export type NewPetToGroup = z.infer<typeof insertPetToGroupSchema>;

export const updatePetToGroupSchema =
  createSelectSchema(petsToGroups).partial();

export type EditPetToGroup = z.infer<typeof updatePetToGroupSchema>;

export const joinGroupFormSchema = z
  .object({
    inviteCode: z.string(),
  })
  .refine(
    // Give error if invite code is not 8 characters long
    (data) => data.inviteCode.length === 8,
    {
      message: "Invite codes are 8 characters long",
      path: ["inviteCode"],
    },
  )
  .refine(
    // Give error if invite code has non alphanumetic characters
    (data) => /^[a-zA-Z0-9]+$/.test(data.inviteCode),
    {
      message:
        "Invite codes only contain alphanumeric characters (a-z, A-Z, 0-9)",
      path: ["inviteCode"],
    },
  );

export type JoinGroupFormData = z.infer<typeof joinGroupFormSchema>;

// -----------------------------------------------------------------------------
// API Form Schemas
// -----------------------------------------------------------------------------

export const requestGroupInviteCodeFormInputSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  maxUses: z.coerce.number(),
  expiresIn: DurationEnum,
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
  id: z.string(),
  petIds: z.array(z.string()),
  groupId: z.string(),
});

export type PetsToGroupFormInput = z.infer<typeof petsToGroupFormInputSchema>;

export const userGroupPairSchema = z.object({
  userId: z.string(),
  groupId: z.string(),
});

export type UserGroupPair = z.infer<typeof userGroupPairSchema>;

export const groupInviteLinkOptionsSchema = z.object({
  linkId: z.string(),
  groupId: z.string(),
  maxUses: z.number(),
  expiresAt: z.coerce.date(),
  requiresApproval: z.boolean(),
});

export type GroupInviteLinkOptions = z.infer<
  typeof groupInviteLinkOptionsSchema
>;

export const acceptPendingMemberSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
});

export type AcceptPendingMember = z.infer<typeof acceptPendingMemberSchema>;
