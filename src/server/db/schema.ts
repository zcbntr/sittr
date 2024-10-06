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
  ({ one }) => ({
    sittingEvents: one(sittingEvents),
  }),
);

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

export const petDetails = createTable("pet_details", {
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

export const petDetailsRelations = relations(petDetails, ({ one }) => ({
  petNotes: one(petNotes),
}));

export const petNotes = createTable("pet_notes", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id")
    .references(() => petDetails.id, { onDelete: "cascade" })
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
  petDetails: one(petDetails, {
    fields: [petNotes.petId],
    references: [petDetails.id],
  }),
}));
