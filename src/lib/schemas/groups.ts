import { z } from "zod";
import {
  groupInviteCodes,
  groupMembers,
  groups,
  petsToGroups,
} from "~/server/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { selectUserSchema } from "./users";
import { selectBasicPetSchema } from "./pets";

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

export const selectGroupMemberSchema = selectBasicGroupMemberSchema.merge(
  z.object({
    user: selectUserSchema.optional(),
    group: selectBasicGroupSchema.optional(),
  }),
);

export const selectGroupSchema = selectBasicGroupSchema.merge(
  z.object({
    members: z.array(selectGroupMemberSchema).optional(),
    pets: z.array(selectBasicPetSchema).optional(),
  }),
);

export type SelectGroup = z.infer<typeof selectGroupSchema>;

export const insertGroupSchema = createInsertSchema(groups);

export type NewGroup = z.infer<typeof insertGroupSchema>;

export const insertGroupWithPetsSchema = insertGroupSchema.merge(
  z.object({
    petIds: z.array(z.string()).optional(),
  }),
);

export type NewGroupWithPets = z.infer<typeof insertGroupWithPetsSchema>;

export const updateGroupSchema = createSelectSchema(groups).partial();

export type EditGroup = z.infer<typeof updateGroupSchema>;

export const selectGroupInviteCodeSchema = createSelectSchema(groupInviteCodes);

export type SelectGroupInviteCode = z.infer<typeof selectGroupInviteCodeSchema>;

export const insertGroupInviteCodeSchema = createInsertSchema(groupInviteCodes);

export type NewGroupInviteCode = z.infer<typeof insertGroupInviteCodeSchema>;

export const updateGroupInviteCodeSchema =
  createSelectSchema(groupInviteCodes).partial();

export type EditGroupInviteCode = z.infer<typeof updateGroupInviteCodeSchema>;

export const selectPetToGroupSchema = createSelectSchema(petsToGroups);

export type SelectPetToGroup = z.infer<typeof selectPetToGroupSchema>;

export const insertPetToGroupSchema = createInsertSchema(petsToGroups);

export type NewPetToGroup = z.infer<typeof insertPetToGroupSchema>;

export const updatePetToGroupSchema =
  createSelectSchema(petsToGroups).partial();

export type EditPetToGroup = z.infer<typeof updatePetToGroupSchema>;

export const joinGroupFormSchema = z.object({
  inviteCode: z.string(),
});

export type JoinGroupFormData = z.infer<typeof joinGroupFormSchema>;

// -----------------------------------------------------------------------------
// API Form Schemas
// -----------------------------------------------------------------------------

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

export const acceptPendingMemberSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
});

export type AcceptPendingMember = z.infer<typeof acceptPendingMemberSchema>;
