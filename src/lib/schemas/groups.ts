import { z } from "zod";
import { petSchema } from "./pets";

export const RoleEnum = z.enum(["Owner", "Sitter"]);
export type RoleEnum = z.infer<typeof RoleEnum>;

export const GroupRoleEnum = z.enum(["Owner", "Member", "Pending"]);
export type GroupRoleEnum = z.infer<typeof GroupRoleEnum>;

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

export const userToGroupSchema = z.object({
  id: z.string(),
  userId: z.string(),
  groupId: z.string(),
  role: GroupRoleEnum,
});

export type UserToGroup = z.infer<typeof userToGroupSchema>;

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

export const joinGroupFormSchema = z.object({
  inviteCode: z.string(),
});

export type JoinGroupFormData = z.infer<typeof joinGroupFormSchema>;
