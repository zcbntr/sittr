import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import {
  GroupRoleEnum,
  WateringFrequency,
} from "~/lib/schema";

export const groupRoleEnum = pgEnum("role", GroupRoleEnum.options);

export const wateringFrequencyEnum = pgEnum(
  "watering_frequency",
  WateringFrequency.options,
);

/**
 * Multi-project schema feature of Drizzle ORM.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sittr_${name}`);

// User preferences for providing sitting services
export const userSittingPreferences = createTable("user_sitting_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  houseSitting: boolean("house_sitting").notNull().default(false),
  petSitting: boolean("pet_sitting").notNull().default(false),
  babySitting: boolean("baby_sitting").notNull().default(false),
  plantSitting: boolean("plant_sitting").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

// User preferences for receiving sitting services
export const userOwnerPreferences = createTable("user_owner_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  houseSitting: boolean("house_sitting").notNull().default(false),
  petSitting: boolean("pet_sitting").notNull().default(false),
  babySitting: boolean("baby_sitting").notNull().default(false),
  plantSitting: boolean("plant_sitting").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

// Tasks can be either due at a certain time or span a certain time period
export const tasks = createTable("tasks", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  dueMode: boolean("due_mode").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  dateRangeFrom: timestamp("date_range_from", { withTimezone: true }),
  dateRangeTo: timestamp("date_range_to", { withTimezone: true }),
  pet: integer("pet").references(
    () => pets.id,
    { onDelete: "cascade" },
  ),
  group: integer("group").references(() => groups.id, {
    onDelete: "cascade",
  }),
  // If the task is marked as done, the user who marked it as done
  markedAsDoneBy: varchar("marked_as_done_by", { length: 255 }),
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

export const petsToGroups = createTable("subjects_to_groups", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  petId: integer("pet_id")
    .references(() => pets.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const petsToGroupsRelations = relations(
  petsToGroups,
  ({ one }) => ({
    group: one(groups, {
      fields: [petsToGroups.groupId],
      references: [groups.id],
    }),
    pet: one(pets, {
      fields: [petsToGroups.petId],
      references: [pets.id],
    }),
  }),
);

export const pets = createTable("pets", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
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
  id: serial("id").primaryKey(),
  petId: integer("pet_id")
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
  id: serial("id").primaryKey(),
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
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
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
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
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
