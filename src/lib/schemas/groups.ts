import { z } from "zod";
import { petSchema } from "./pets";
import { userSchema } from "./users";
import { GroupRoleEnum } from ".";

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

export const groupMemberSchema = z.object({
  groupId: z.string(),
  user: userSchema,
  role: GroupRoleEnum,
});

export type GroupMember = z.infer<typeof groupMemberSchema>;

export const groupMemberListSchema = z.array(groupMemberSchema);

export type GroupMemberList = z.infer<typeof groupMemberListSchema>;

export const groupSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  createdBy: userSchema.nullable().optional(),
  name: z.string(),
  description: z.string().optional(),
  members: z.array(groupMemberSchema).optional(),
  pets: z.array(petSchema).optional(),
});

export type Group = z.infer<typeof groupSchema>;

export const groupListSchema = z.array(groupSchema);

export type GroupList = z.infer<typeof groupListSchema>;

export const groupInviteCodeSchema = z.object({
  inviteId: z.string(),
  createdBy: userSchema,
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

export const joinGroupFormSchema = z.object({
  inviteCode: z.string(),
});

export type JoinGroupFormData = z.infer<typeof joinGroupFormSchema>;

// -----------------------------------------------------------------------------
// API Form Schemas
// -----------------------------------------------------------------------------

export const createGroupInputSchema = z.object({
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
  petIds: z
    .array(z.string())
    .refine((data) => data.length > 0, "Must include at least one pet"),
});

export type CreateGroupFormInput = z.infer<typeof createGroupInputSchema>;

export const requestGroupInviteCodeFormInputSchema = z.object({
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

export const groupDetailsSchema = z.object({
  groupId: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export type GroupDetails = z.infer<typeof groupDetailsSchema>;

export const acceptPendingMemberSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
});

export type AcceptPendingMember = z.infer<typeof acceptPendingMemberSchema>;
