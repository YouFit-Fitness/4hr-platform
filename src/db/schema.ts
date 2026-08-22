import { pgTable, pgEnum, uuid, text, timestamp, jsonb, date, integer, boolean } from "drizzle-orm/pg-core";

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
  inviteUrl: text("invite_url"), // Clerk invitation link — coach can share it directly (e.g. WhatsApp)
  inviteCode: text("invite_code").unique(), // short code for a branded /i/<code> redirect
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

// ── Phase 2A: Training ──────────────────────────────────────────────────────

/** Reusable exercise library (coach-managed). Optional demo video for clients. */
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group"),
  equipment: text("equipment"), // Barbell / Dumbbell / Cable / Machine / Bodyweight / …
  movementCategory: text("movement_category"), // Horizontal Push / Hinge / Squat / Isolation / …
  videoUrl: text("video_url"),
  cues: text("cues"),
  archived: boolean("archived").notNull().default(false), // hide without deleting (history-safe)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A training program template — a set of workout days that repeat weekly. */
export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const programDays = pgTable("program_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(0),
  title: text("title").notNull(),
});

export const programExercises = pgTable("program_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  programDayId: uuid("program_day_id").notNull().references(() => programDays.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id, { onDelete: "restrict" }),
  orderIndex: integer("order_index").notNull().default(0),
  targetSets: integer("target_sets"),
  targetReps: text("target_reps"), // e.g. "8–12"
  targetRpe: text("target_rpe"),
  tempo: text("tempo"), // e.g. "3-1-1"
  restSeconds: integer("rest_seconds"),
  notes: text("notes").notNull().default(""),
});

/** Which program a client is on. One active program per client (MVP). */
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "restrict" }),
  active: boolean("active").notNull().default(true),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A logged training session for a given program day. */
export const workoutLogs = pgTable("workout_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  programDayId: uuid("program_day_id").references(() => programDays.id, { onDelete: "set null" }),
  dayTitle: text("day_title"), // snapshot for history if the day is later changed
  performedOn: date("performed_on").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One logged set within a workout. Exercise name is snapshotted for history. */
export const setLogs = pgTable("set_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutLogId: uuid("workout_log_id").notNull().references(() => workoutLogs.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").references(() => exercises.id, { onDelete: "set null" }),
  exerciseName: text("exercise_name").notNull(),
  setNo: integer("set_no").notNull(),
  weight: text("weight"), // text to allow units / "bodyweight"
  reps: integer("reps"),
  rpe: text("rpe"),
});

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type OnboardingResponse = typeof onboardingResponses.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type ProgramDay = typeof programDays.$inferSelect;
export type ProgramExercise = typeof programExercises.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type SetLog = typeof setLogs.$inferSelect;
