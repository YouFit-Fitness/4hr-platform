import { pgTable, pgEnum, uuid, text, timestamp, jsonb, date } from "drizzle-orm/pg-core";

/**
 * 4HR platform — core identity + client-lifecycle schema (Phase 1 only).
 * Deliberately minimal: users, clients, and onboarding responses. Training,
 * nutrition, check-ins, media, etc. are LATER phases and are not modelled here.
 */

// Two roles for V1. Designed so more roles could be added without a rewrite.
export const roleEnum = pgEnum("role", ["COACH", "CLIENT"]);

// Client lifecycle. Extensible — add states later without breaking existing rows.
export const clientStatusEnum = pgEnum("client_status", [
  "INVITED",
  "ONBOARDING",
  "PLAN_SETUP",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
]);

/** Every authenticated person (coach or client). Linked to a Clerk user. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").unique(), // filled on first sign-in
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: roleEnum("role").notNull().default("CLIENT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A coaching client record. Created at INVITE time (before the Clerk user exists),
 * keyed by email; linked to the user row on first sign-in. start/end dates are
 * configurable (NOT hardcoded to 12 weeks) so the UI can compute "week X of Y".
 */
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id), // null until they activate
  email: text("email").notNull().unique(),
  status: clientStatusEnum("status").notNull().default("INVITED"),
  sourceLeadEmail: text("source_lead_email"), // optional link back to a marketing lead
  startDate: date("start_date"),
  endDate: date("end_date"),
  coachNotes: text("coach_notes").notNull().default(""),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** The onboarding questionnaire answers (structured JSON, one row per client). */
export const onboardingResponses = pgTable("onboarding_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type OnboardingResponse = typeof onboardingResponses.$inferSelect;
