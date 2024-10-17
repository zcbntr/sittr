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
  SittingTypeEnum,
  WateringFrequency,
} from "~/lib/schema";

export const categoryEnum = pgEnum("category", SittingTypeEnum.options);

export const groupRoleEnum = pgEnum("role", GroupRoleEnum.options);

export const wateringFrequencyEnum = pgEnum(
  "watering_frequency",
  WateringFrequency.options,
);

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
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

// Tasks are small todos.
// Can be either due at a certain time or span a certain time period
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
  sittingSubject: integer("sitting_subject").references(
    () => sittingSubjects.id,
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
  sittingSubject: one(sittingSubjects, {
    fields: [tasks.sittingSubject],
    references: [sittingSubjects.entityId],
  }),
  group: one(groups, {
    fields: [tasks.group],
    references: [groups.id],
  }),
}));

// Represents Pet, House or Plant sitting subject. Single table for accessing pets, houses and plants in general
export const sittingSubjects = createTable("sitting_subjects", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owned_by", { length: 255 }).notNull(),
  entityType: varchar("type", { length: 255 }).notNull(),
  // Foreign key to the Pet, House or Plant table - not sure how to do delete cascade here
  entityId: integer("entity_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const sittingSubjectsRelations = relations(
  sittingSubjects,
  ({ one, many }) => ({
    pet: one(pets),
    house: one(houses),
    plant: one(plants),
    subjectsToGroups: many(subjectsToGroups),
  }),
);

export const subjectsToGroups = createTable("subjects_to_groups", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  subjectId: integer("subject_id")
    .references(() => sittingSubjects.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const subjectsToGroupsRelations = relations(
  subjectsToGroups,
  ({ one }) => ({
    group: one(groups, {
      fields: [subjectsToGroups.groupId],
      references: [groups.id],
    }),
    subject: one(sittingSubjects, {
      fields: [subjectsToGroups.subjectId],
      references: [sittingSubjects.id],
    }),
  }),
);

export const pets = createTable("pets", {
  id: serial("id").primaryKey(),
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
  sittingSubjects: one(sittingSubjects, {
    fields: [pets.id],
    references: [sittingSubjects.entityId],
  }),
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

export const houses = createTable("houses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const houseRelations = relations(houses, ({ one }) => ({
  houseNotes: one(houseNotes),
  sittingSubjects: one(sittingSubjects, {
    fields: [houses.id],
    references: [sittingSubjects.entityId],
  }),
}));

export const houseNotes = createTable("house_notes", {
  id: serial("id").primaryKey(),
  houseId: integer("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const houseNotesRelations = relations(houseNotes, ({ one }) => ({
  houseDetails: one(houses, {
    fields: [houseNotes.houseId],
    references: [houses.id],
  }),
}));

export const plants = createTable("plants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  species: varchar("species", { length: 255 }),
  lastWatered: timestamp("last_watered", { withTimezone: true }),
  wateringFrequency: wateringFrequencyEnum("watering_frequency").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const plantRelations = relations(plants, ({ one }) => ({
  plantNotes: one(plantNotes),
  sittingSubjects: one(sittingSubjects, {
    fields: [plants.id],
    references: [sittingSubjects.entityId],
  }),
}));

export const plantNotes = createTable("plant_notes", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id")
    .references(() => plants.id, { onDelete: "cascade" })
    .notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const plantNotesRelations = relations(plantNotes, ({ one }) => ({
  plantDetails: one(plants, {
    fields: [plantNotes.plantId],
    references: [plants.id],
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
  subjectsToGroups: many(subjectsToGroups),
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
