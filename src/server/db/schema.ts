import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTableCreator,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v4 as uuid } from "uuid";
import { GroupRoleEnum } from "~/lib/schema";

export const groupRoleEnum = pgEnum("role", GroupRoleEnum.options);

/**
 * Multi-project schema feature of Drizzle ORM.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sittr_${name}`);

// Tasks can be either due at a certain time or span a certain time period
export const tasks = createTable("tasks", {
  id: text("id")
    .$defaultFn(() => uuid())
    .primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  dueMode: boolean("due_mode").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  dateRangeFrom: timestamp("date_range_from", { withTimezone: true }),
  dateRangeTo: timestamp("date_range_to", { withTimezone: true }),
  pet: text("pet").references(() => pets.id, { onDelete: "cascade" }),
  group: text("group").references(() => groups.id, {
    onDelete: "cascade",
  }),
  // If the task is marked as done, the user who marked it as done
  markedAsDoneBy: text("marked_as_done_by"),
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
  pet: one(pets, {
    fields: [tasks.pet],
    references: [pets.id],
  }),
  group: one(groups, {
    fields: [tasks.group],
    references: [groups.id],
  }),
}));

export const petsToGroups = createTable("pets_to_groups", {
  id: text("id")
    .$defaultFn(() => uuid())
    .primaryKey(),
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
});

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
    .$defaultFn(() => uuid())
    .primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  species: varchar("species", { length: 255 }).notNull(),
  breed: varchar("breed", { length: 255 }),
  dob: timestamp("dob", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const petRelations = relations(pets, ({ one }) => ({
  petNotes: one(petNotes),
}));

export const petNotes = createTable("pet_notes", {
  id: text("id")
    .$defaultFn(() => uuid())
    .primaryKey(),
  petId: text("pet_id")
    .references(() => pets.id, { onDelete: "cascade" })
    .notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const petNotesRelations = relations(petNotes, ({ one }) => ({
  petDetails: one(pets, {
    fields: [petNotes.petId],
    references: [pets.id],
  }),
}));

export const groups = createTable("groups", {
  id: text("id")
    .$defaultFn(() => uuid())
    .primaryKey(),
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
  groupMembers: many(groupMembers),
  petsToGroups: many(petsToGroups),
}));

export const groupMembers = createTable("group_members", {
  id: text("id")
    .$defaultFn(() => uuid())
    .primaryKey(),
  groupId: text("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(),
  role: groupRoleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
}));

export const groupInviteCodes = createTable("group_invite_codes", {
  id: text("id")
    .$defaultFn(() => uuid())
    .primaryKey(),
  groupId: text("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
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
