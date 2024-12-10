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
import { GroupRoleEnum, SexEnum } from "~/lib/schemas";

/**
 * Multi-project schema feature of Drizzle ORM.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sittr_${name}`);

export const groupRoleEnum = pgEnum("role", GroupRoleEnum.options);
export const sexEnum = pgEnum("sex", SexEnum.options);

export const users = createTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const userRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  verificationTokens: many(verificationTokens),
  authenticators: many(authenticators),
  tasks: many(tasks),
  pets: many(pets),
  groups: many(groups),
  groupInviteCodes: many(groupInviteCodes),
  usersToGroups: many(usersToGroups),
}));

export const accounts = createTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = createTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = createTable(
  "verificationToken",
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

export const authenticators = createTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

// Tasks can be either due at a certain time or span a certain time period
export const tasks = createTable("tasks", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Set by task owner when they approve of its completion if requiresVerification is true
  completed: boolean("completed").notNull().default(false),
  dueMode: boolean("due_mode").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  dateRangeFrom: timestamp("date_range_from", { withTimezone: true }),
  dateRangeTo: timestamp("date_range_to", { withTimezone: true }),
  pet: text("pet").references(() => pets.id, { onDelete: "cascade" }),
  group: text("group").references(() => groups.id, {
    onDelete: "cascade",
  }),
  // The user who is planning to complete the task
  claimedBy: text("claimed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  // If the task is marked as done, the user who marked it as done
  markedAsDoneBy: text("marked_as_done_by").references(() => users.id, {
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

export const tasksRelations = relations(tasks, ({ one }) => ({
  owner: one(users, {
    fields: [tasks.ownerId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  claimedBy: one(users, {
    fields: [tasks.claimedBy],
    references: [users.id],
  }),
  markedAsDoneBy: one(users, {
    fields: [tasks.markedAsDoneBy],
    references: [users.id],
  }),
  pet: one(pets, {
    fields: [tasks.pet],
    references: [pets.id],
  }),
  group: one(groups, {
    fields: [tasks.group],
    references: [groups.id],
  }),
}));

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
  (t) => ({
    unique: unique().on(t.groupId, t.petId),
    compoundKey: primaryKey({
      columns: [t.groupId, t.petId],
    }),
  }),
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
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  species: varchar("species", { length: 255 }).notNull(),
  breed: varchar("breed", { length: 255 }),
  dob: timestamp("dob", { withTimezone: true }),
  sex: sexEnum("sex"),
  image: text("image"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const petRelations = relations(pets, ({ one }) => ({
  tasks: one(tasks, {
    fields: [pets.id],
    references: [tasks.pet],
  }),
  petImages: one(petImages, {
    fields: [pets.id],
    references: [petImages.petId],
  }),
}));

export const groups = createTable("groups", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const groupsRelations = relations(groups, ({ many }) => ({
  tasks: many(tasks),
  groupInviteCodes: many(groupInviteCodes),
  usersToGroups: many(usersToGroups),
  petsToGroups: many(petsToGroups),
}));

export const usersToGroups = createTable(
  "users_to_groups",
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
  (t) => ({
    unique: unique().on(t.groupId, t.userId),
    compoundKey: primaryKey({
      columns: [t.userId, t.groupId],
    }),
  }),
);

export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
  user: one(users, {
    fields: [usersToGroups.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [usersToGroups.groupId],
    references: [groups.id],
  }),
}));

export const groupInviteCodes = createTable("group_invite_codes", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  groupId: text("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
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
    group: one(groups, {
      fields: [groupInviteCodes.groupId],
      references: [groups.id],
    }),
  }),
);

export const petImages = createTable("pet_images", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  // Do not use .notNull() here, as the pet may not have been created yet
  petId: text("pet_id").references(() => pets.id, { onDelete: "cascade" }),
  uploadedBy: text("uploaded_by")
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
  pet: one(pets, {
    fields: [petImages.petId],
    references: [pets.id],
  }),
}));
