import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sittr_${name}`);

// User preferences for the sitting services they can provide
export const userSittingPreferances = createTable("user_sitting_preferences", {
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

// User preferences for the sitting services they require
export const userOwnerPreferances = createTable("user_owner_preferences", {
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

// Sittings listings have an owner
export const sittingListings = createTable("sitting_listing", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  fulfilled: boolean("fulfilled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

// Sitting listings can have multiple events
export const sittingListingsRelations = relations(
  sittingListings,
  ({ many }) => ({
    events: many(sittingRequests),
  }),
);

// A sitting request is a request for sittering for a specific time period for a specific listing
export const sittingRequests = createTable("sitting_requests", {
  id: serial("id").primaryKey(),
  sittingListing: integer("sitting_listing_id")
    .references(() => sittingListings.id, { onDelete: "cascade" })
    .notNull(),
  startDate: varchar("start_date", { length: 255 }).notNull(),
  endDate: varchar("end_date", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

// Sitting requests can only be for a single listing
export const sittingRequestsRelations = relations(
  sittingRequests,
  ({ one }) => ({
    listing: one(sittingListings, {
      fields: [sittingRequests.sittingListing],
      references: [sittingListings.id],
    }),
  }),
);

// A sitting event is a completed sitting request
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