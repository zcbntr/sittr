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

export const categoryEnum = pgEnum("category", [
  "House",
  "Pet",
  "Baby",
  "Plant",
]);

export const roleEnum = pgEnum("role", ["Owner", "Member", "PendingApproval"]);

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sittr_${name}`);

// User preferences for the sitting services they provide/require
export const userPreferances = createTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  isOwner: boolean("is_owner").notNull().default(true),
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

// A sitting request is a request for sittering for a specific time period
export const sittingRequests = createTable("sitting_requests", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: categoryEnum("category").notNull(),
  fulfilled: boolean("fulfilled").notNull().default(false),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const sittingRequestsRelations = relations(
  sittingRequests,
  ({ one, many }) => ({
    sittingEvents: one(sittingEvents),
    tasks: many(tasks),
  }),
);

// Tasks are small todos. They can be associated with a sitting request but not required
// Can be either due at a certain time or span a certain time period
export const tasks = createTable("tasks", {
  id: serial("id").primaryKey(),
  sittingRequestId: integer("sitting_request_id").references(
    () => sittingRequests.id,
    { onDelete: "cascade" },
  ),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date", { withTimezone: true }),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  sittingRequest: one(sittingRequests, {
    fields: [tasks.sittingRequestId],
    references: [sittingRequests.id],
  }),
}));

// A sitting event is a scheduled sitting based on a sitting request and a sitter
// Will need additional details connected to the event for the sitter to provide to the owner
export const sittingEvents = createTable("sitting_events", {
  id: serial("id").primaryKey(),
  sittingRequest: integer("sitting_request_id")
    .references(() => sittingRequests.id, { onDelete: "cascade" })
    .notNull(),
  sitterId: varchar("sitter_id", { length: 255 }).notNull(),
  fulfilled: boolean("fulfilled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const sittingEventsRelations = relations(sittingEvents, ({ one }) => ({
  sittingRequest: one(sittingRequests, {
    fields: [sittingEvents.sittingRequest],
    references: [sittingRequests.id],
  }),
}));

// Represents Pet, House or Plant sitting subject. Single table for accessing pets, houses and plants in general
export const sittingSubjects = createTable("sitting_subjects", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owned_by", { length: 255 }).notNull(),
  entityType: varchar("type", { length: 255 }).notNull(),
  // Foreign key to the Pet, House or Plant table
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
  role: roleEnum("role").notNull(),
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
  subjects: one(sittingSubjects),
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

export const houses = createTable("houses", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const houseRelations = relations(houses, ({ one }) => ({
  houseNotes: one(houseNotes),
  subjects: one(sittingSubjects),
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
  species: varchar("species", { length: 255 }).notNull(),
  lastWatered: timestamp("last_watered", { withTimezone: true }).notNull(),
  wateringFrequency: integer("watering_frequency").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const plantRelations = relations(plants, ({ one }) => ({
  plantNotes: one(plantNotes),
  subjects: one(sittingSubjects),
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
  groupInviteCodes: many(groupInviteCodes),
  groupMembers: many(groupMembers),
  sittingSubjects: many(sittingSubjects),
}));

export const groupMembers = createTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const groupMembersRelations = relations(
  groupMembers,
  ({ one, many }) => ({
    group: one(groups, {
      fields: [groupMembers.groupId],
      references: [groups.id],
    }),
    subjectsToGroups: many(subjectsToGroups),
  }),
);

export const groupInviteCodes = createTable("group_invite_codes", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  uses: integer("uses").notNull().default(0),
  maxUses: integer("max_uses").notNull().default(1),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  valid: boolean("valid").notNull().default(true),
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
