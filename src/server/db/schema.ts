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
  startDate: varchar("start_date", { length: 255 }).notNull(),
  endDate: varchar("end_date", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

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
