import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userProfiles = sqliteTable("user_profiles", {
  sessionId: text("session_id").primaryKey(),
  postcode: text("postcode").notNull().default("2033"),
  retailers: text("retailers").notNull().default("[\"coles\",\"woolworths\",\"aldi\"]"),
  pantryItems: text("pantry_items").notNull().default("[\"olive oil\",\"garlic\",\"salt\"]"),
  dietaryPreferences: text("dietary_preferences").notNull().default("[]"),
  email: text("email").notNull().default(""),
  alertsEnabled: integer("alerts_enabled", { mode: "boolean" }).notNull().default(false),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const priceObservations = sqliteTable("price_observations", {
  id: text("id").primaryKey(),
  retailer: text("retailer").notNull(),
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  currentPrice: real("current_price").notNull(),
  wasPrice: real("was_price"),
  capturedAt: text("captured_at").notNull(),
});

export const watchlistItems = sqliteTable("watchlist_items", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  dealId: text("deal_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const workflowSessions = sqliteTable("workflow_sessions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  manualSeconds: text("manual_seconds").notNull(),
  appSeconds: text("app_seconds").notNull(),
  createdAt: text("created_at").notNull(),
});
