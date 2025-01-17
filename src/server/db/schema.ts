import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTableCreator,
  text,
  timestamp,
  unique,
  varchar,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import { GroupRoleEnum, NotificationTypeEnum } from "~/lib/schemas";
import { PlanEnum } from "../queries/users";

/**
 * Multi-project schema feature of Drizzle ORM.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sittr_${name}`);

export const planEnum = pgEnum("plan", PlanEnum.options);

export const groupRoleEnum = pgEnum("role", GroupRoleEnum.options);
export const notificationTypeEnum = pgEnum(
  "notification_type",
  NotificationTypeEnum.options,
);

export const users = createTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12)),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  plan: planEnum("plan").notNull().default("Free"),
});

export const userRelations = relations(users, ({ one, many }) => ({
  notificationPreferences: one(notificationPreferences, {
    fields: [users.id],
    references: [notificationPreferences.userId],
    relationName: "user",
  }),
  tasksCreated: many(tasks, { relationName: "creator" }),
  tasksOwned: many(tasks, { relationName: "owner" }),
  tasksClaimed: many(tasks, { relationName: "claimedBy" }),
  tasksMarkedAsDone: many(tasks, { relationName: "markedAsDoneBy" }),
  taskInstructionImages: many(taskInstructionImages, {
    relationName: "uploader",
  }),
  taskCompletionImages: many(taskCompletionImages, {
    relationName: "uploader",
  }),
  petsCreated: many(pets, { relationName: "creator" }),
  petsOwned: many(pets, { relationName: "owner" }),
  petImages: many(petImages, { relationName: "uploader" }),
  groupsOwned: many(groups, { relationName: "owner" }),
  groupsCreated: many(groups, { relationName: "creator" }),
  groupInviteCodes: many(groupInviteCodes),
  groupMembers: many(groupMembers),
  notifications: many(notifications),
}));

export const accounts = createTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => {
    return [
      {
        pk: primaryKey({
          columns: [account.provider, account.providerAccountId],
        }),
      },
    ];
  },
);

export const sessions = createTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

// Tasks can be either due at a certain time or span a certain time period
export const tasks = createTable("tasks", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: text("creator_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Set by task owner when they approve of its completion if requiresVerification is true
  completedAt: timestamp("completed_at", { withTimezone: true }),
  dueMode: boolean("due_mode").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  dateRangeFrom: timestamp("date_range_from", { withTimezone: true }),
  dateRangeTo: timestamp("date_range_to", { withTimezone: true }),
  petId: text("pet_id").references(() => pets.id, { onDelete: "cascade" }),
  groupId: text("group_id").references(() => groups.id, {
    onDelete: "cascade",
  }),
  // The user who is planning to complete the task
  claimedById: text("claimed_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  // If the task is marked as done, the user who marked it as done
  markedAsDoneById: text("marked_as_done_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  markedAsDoneAt: timestamp("marked_as_done_at", { withTimezone: true }),
  requiresVerification: boolean("requires_verification")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  owner: one(users, {
    fields: [tasks.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  creator: one(users, {
    fields: [tasks.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  claimedBy: one(users, {
    fields: [tasks.claimedById],
    references: [users.id],
    relationName: "claimedBy",
  }),
  markedAsDoneBy: one(users, {
    fields: [tasks.markedAsDoneById],
    references: [users.id],
    relationName: "markedAsDoneBy",
  }),
  pet: one(pets, {
    fields: [tasks.petId],
    references: [pets.id],
  }),
  group: one(groups, {
    fields: [tasks.groupId],
    references: [groups.id],
  }),
  instructionImages: many(taskInstructionImages),
  completionImages: many(taskCompletionImages),
  notifications: many(notifications),
}));

export const taskInstructionImages = createTable("task_instruction_images", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  // Do not use .notNull() here, as the pet may not have been created yet, or the pet may have been deleted
  // We need to keep the image row so we can delete the image from uploadthing
  taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
  uploaderId: text("uploader_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  fileKey: text("file_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const taskInstructionImagesRelations = relations(
  taskInstructionImages,
  ({ one }) => ({
    uploader: one(users, {
      fields: [taskInstructionImages.uploaderId],
      references: [users.id],
      relationName: "uploader",
    }),
    task: one(tasks, {
      fields: [taskInstructionImages.taskId],
      references: [tasks.id],
    }),
  }),
);

export const taskCompletionImages = createTable("task_completion_images", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  // Do not use .notNull() here, as the pet may not have been created yet, or the pet may have been deleted
  // We need to keep the image row so we can delete the image from uploadthing
  taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
  uploaderId: text("uploader_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  fileKey: text("file_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const taskCompletionImagesRelations = relations(
  taskCompletionImages,
  ({ one }) => ({
    uploader: one(users, {
      fields: [taskCompletionImages.uploaderId],
      references: [users.id],
      relationName: "uploader",
    }),
    task: one(tasks, {
      fields: [taskCompletionImages.taskId],
      references: [tasks.id],
    }),
  }),
);

export const petsToGroups = createTable(
  "pets_to_groups",
  {
    groupId: text("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    petId: text("pet_id")
      .references(() => pets.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (petToGroup) => {
    return [
      {
        unique: unique().on(petToGroup.groupId, petToGroup.petId),
        pk: primaryKey({
          columns: [petToGroup.groupId, petToGroup.petId],
        }),
      },
    ];
  },
);

export const petsToGroupsRelations = relations(petsToGroups, ({ one }) => ({
  group: one(groups, {
    fields: [petsToGroups.groupId],
    references: [groups.id],
  }),
  pet: one(pets, {
    fields: [petsToGroups.petId],
    references: [pets.id],
  }),
}));

export const pets = createTable("pets", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  creatorId: text("creator_id").references(() => users.id, {
    onDelete: "set null",
  }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  species: varchar("species", { length: 255 }).notNull(),
  breed: varchar("breed", { length: 255 }),
  dob: timestamp("dob", { withTimezone: true }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const petRelations = relations(pets, ({ one, many }) => ({
  creator: one(users, {
    fields: [pets.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  owner: one(users, {
    fields: [pets.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  tasks: one(tasks, {
    fields: [pets.id],
    references: [tasks.petId],
  }),
  profilePic: one(petProfilePics, {
    fields: [pets.id],
    references: [petProfilePics.petId],
  }),
  petImages: many(petImages),
  notifications: many(notifications),
  petsToGroups: many(petsToGroups),
}));

export const groups = createTable("groups", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: text("creator_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, {
    fields: [groups.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  tasks: many(tasks),
  groupInviteCodes: many(groupInviteCodes),
  members: many(groupMembers),
  petsToGroups: many(petsToGroups),
  notifications: many(notifications),
}));

export const groupMembers = createTable(
  "group_members",
  {
    groupId: text("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: groupRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (groupMember) => {
    return [
      {
        unique: unique().on(groupMember.groupId, groupMember.userId),
        pk: primaryKey({
          columns: [groupMember.userId, groupMember.groupId],
        }),
      },
    ];
  },
);

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
}));

export const groupInviteCodes = createTable("group_invite_codes", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  groupId: text("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 255 }).notNull().unique(),
  uses: integer("uses").notNull().default(0),
  maxUses: integer("max_uses").notNull().default(1),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const groupInviteCodesRelations = relations(
  groupInviteCodes,
  ({ one }) => ({
    creator: one(users, {
      fields: [groupInviteCodes.creatorId],
      references: [users.id],
    }),
    group: one(groups, {
      fields: [groupInviteCodes.groupId],
      references: [groups.id],
    }),
  }),
);

export const petImages = createTable("pet_images", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  // Do not use .notNull() here, as the pet may not have been created yet, or the pet may have been deleted
  // We need to keep the image row so we can delete the image from uploadthing
  petId: text("pet_id").references(() => pets.id, { onDelete: "set null" }),
  uploaderId: text("uploader_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  fileKey: text("file_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const petImagesRelations = relations(petImages, ({ one }) => ({
  uploader: one(users, {
    fields: [petImages.uploaderId],
    references: [users.id],
    relationName: "uploader",
  }),
  pet: one(pets, {
    fields: [petImages.petId],
    references: [pets.id],
  }),
}));

export const petProfilePics = createTable("pet_profile_pics", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  // Do not use .notNull() here, as the pet may not have been created yet, or the pet may have been deleted
  // We need to keep the image row so we can delete the image from uploadthing
  petId: text("pet_id").references(() => pets.id, { onDelete: "set null" }),
  uploaderId: text("uploader_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  fileKey: text("file_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const petProfilePicRelations = relations(petProfilePics, ({ one }) => ({
  uploader: one(users, {
    fields: [petProfilePics.uploaderId],
    references: [users.id],
    relationName: "uploader",
  }),
  pet: one(pets, {
    fields: [petProfilePics.petId],
    references: [pets.id],
  }),
}));

export const notifications = createTable("notification", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  associatedTaskId: text("associated_task_id").references(() => tasks.id, {
    onDelete: "set null",
  }),
  associatedGroupId: text("associated_group_id").references(() => groups.id, {
    onDelete: "set null",
  }),
  associatedPetId: text("associated_pet_id").references(() => pets.id, {
    onDelete: "set null",
  }),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  associatedTask: one(tasks, {
    fields: [notifications.associatedTaskId],
    references: [tasks.id],
  }),
  associatedGroup: one(groups, {
    fields: [notifications.associatedGroupId],
    references: [groups.id],
  }),
  associatedPet: one(pets, {
    fields: [notifications.associatedPetId],
    references: [pets.id],
  }),
}));

export const notificationPreferences = createTable("notification_preferences", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID().replace("-", "").substring(0, 12))
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  emailUpcomingTasks: boolean("email_upcoming_tasks").notNull().default(false),
  emailOverdueTasks: boolean("email_overdue_tasks").notNull().default(false),
  emailGroupMembershipChanges: boolean("email_group_membership_changes")
    .notNull()
    .default(false),
  emailPetBirthdays: boolean("email_pet_birthdays").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const notificationPreferencesRelations = relations(
  notifications,
  ({ one }) => ({
    user: one(users, {
      fields: [notifications.userId],
      references: [users.id],
      relationName: "user",
    }),
  }),
);
