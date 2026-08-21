import "server-only";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { db, assignments, programs, programDays, programExercises, exercises, workoutLogs, setLogs, users } from "@/db";
import type { Client } from "@/db";

const WEEK_MS = 7 * 864e5;
const asDate = (d: string) => new Date(d.slice(0, 10) + "T00:00:00");

export type DayOverview = {
  id: string;
  title: string;
  exerciseCount: number;
  lastPerformed: string | null; // YYYY-MM-DD
  completedThisWeek: boolean;
};
export type RecentWorkout = { id: string; dayTitle: string | null; performedOn: string; setCount: number };
export type TrainingOverview = {
  program: { name: string; description: string } | null;
  days: DayOverview[];
  upNextId: string | null;
  allDoneThisWeek: boolean;
  week: { current: number; total: number | null; fraction: number } | null;
  recent: RecentWorkout[];
  coachName: string | null;
};

/**
 * Everything the client training dashboard needs, derived from EXISTING data
 * only (no schema changes): per-day exercise counts + completion, the next due
 * day, week progress, recent sessions with set counts, and the coach's name.
 */
export async function getTrainingOverview(client: Client): Promise<TrainingOverview> {
  const coachRow = await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.role, "COACH")).limit(1);
  const coachName = coachRow[0] ? [coachRow[0].firstName, coachRow[0].lastName].filter(Boolean).join(" ").trim() || null : null;

  const active = await getActiveProgram(client.id);
  const week = weekProgress(client.startDate, client.endDate);

  // Recent logs (also used to derive per-day last-performed).
  const logs = await db
    .select({ id: workoutLogs.id, programDayId: workoutLogs.programDayId, dayTitle: workoutLogs.dayTitle, performedOn: workoutLogs.performedOn })
    .from(workoutLogs)
    .where(eq(workoutLogs.clientId, client.id))
    .orderBy(desc(workoutLogs.performedOn), desc(workoutLogs.createdAt))
    .limit(50);

  const recentIds = logs.slice(0, 6).map((l) => l.id);
  const setRows = recentIds.length ? await db.select({ workoutLogId: setLogs.workoutLogId }).from(setLogs).where(inArray(setLogs.workoutLogId, recentIds)) : [];
  const setCount = new Map<string, number>();
  for (const r of setRows) setCount.set(r.workoutLogId, (setCount.get(r.workoutLogId) ?? 0) + 1);
  const recent: RecentWorkout[] = logs.slice(0, 6).map((l) => ({ id: l.id, dayTitle: l.dayTitle, performedOn: l.performedOn, setCount: setCount.get(l.id) ?? 0 }));

  if (!active) {
    return { program: null, days: [], upNextId: null, allDoneThisWeek: false, week, recent, coachName };
  }

  const dayIds = active.days.map((d) => d.id);
  const exRows = dayIds.length ? await db.select({ programDayId: programExercises.programDayId }).from(programExercises).where(inArray(programExercises.programDayId, dayIds)) : [];
  const exCount = new Map<string, number>();
  for (const r of exRows) exCount.set(r.programDayId, (exCount.get(r.programDayId) ?? 0) + 1);

  // Latest performed date per day (from this program's days).
  const lastPerformed = new Map<string, string>();
  for (const l of logs) {
    if (l.programDayId && !lastPerformed.has(l.programDayId)) lastPerformed.set(l.programDayId, l.performedOn);
  }

  const weekStart = client.startDate && week ? new Date(asDate(client.startDate).getTime() + (week.current - 1) * WEEK_MS) : null;
  const days: DayOverview[] = active.days.map((d) => {
    const lp = lastPerformed.get(d.id) ?? null;
    const completedThisWeek = !!(lp && weekStart && asDate(lp).getTime() >= weekStart.getTime());
    return { id: d.id, title: d.title, exerciseCount: exCount.get(d.id) ?? 0, lastPerformed: lp, completedThisWeek };
  });

  // "Up next" = first day (in program order) not yet completed this week.
  const upNext = days.find((d) => !d.completedThisWeek) ?? null;
  const allDoneThisWeek = days.length > 0 && !upNext;

  return {
    program: active.program ? { name: active.program.name, description: active.program.description } : null,
    days,
    upNextId: upNext?.id ?? null,
    allDoneThisWeek,
    week,
    recent,
    coachName,
  };
}

function weekProgress(startDate: string | null, endDate: string | null): TrainingOverview["week"] {
  if (!startDate) return null;
  const start = asDate(startDate).getTime();
  const now = Date.now();
  const current = Math.max(1, Math.floor((now - start) / WEEK_MS) + 1);
  if (endDate) {
    const total = Math.max(1, Math.round((asDate(endDate).getTime() - start) / WEEK_MS));
    const capped = Math.min(current, total);
    return { current: capped, total, fraction: Math.min(1, capped / total) };
  }
  return { current, total: null, fraction: 0 };
}

/** Human date: "21 Aug 2026". */
export function formatDay(d: string): string {
  return asDate(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** The client's active program + its (weekly) days. Null if none assigned. */
export async function getActiveProgram(clientId: string) {
  const [a] = await db
    .select({ programId: assignments.programId })
    .from(assignments)
    .where(and(eq(assignments.clientId, clientId), eq(assignments.active, true)))
    .limit(1);
  if (!a) return null;
  const [program] = await db.select().from(programs).where(eq(programs.id, a.programId)).limit(1);
  const days = await db
    .select()
    .from(programDays)
    .where(eq(programDays.programId, a.programId))
    .orderBy(asc(programDays.orderIndex));
  return { program, days };
}

/** A day's prescribed exercises (with targets + demo video). */
export async function getDayWithExercises(dayId: string) {
  const [day] = await db.select().from(programDays).where(eq(programDays.id, dayId)).limit(1);
  if (!day) return null;
  const items = await db
    .select({
      id: programExercises.id,
      exerciseId: programExercises.exerciseId,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      cues: exercises.cues,
      videoUrl: exercises.videoUrl,
      targetSets: programExercises.targetSets,
      targetReps: programExercises.targetReps,
      targetRpe: programExercises.targetRpe,
      restSeconds: programExercises.restSeconds,
      notes: programExercises.notes,
    })
    .from(programExercises)
    .innerJoin(exercises, eq(programExercises.exerciseId, exercises.id))
    .where(eq(programExercises.programDayId, dayId))
    .orderBy(asc(programExercises.orderIndex));
  return { day, items };
}

/**
 * The client's most recent logged session for a given day (they repeat weekly),
 * so the logger can show "last time" per exercise. Keyed by exerciseId.
 */
export async function lastSessionForDay(clientId: string, dayId: string) {
  const [prev] = await db
    .select({ id: workoutLogs.id, performedOn: workoutLogs.performedOn })
    .from(workoutLogs)
    .where(and(eq(workoutLogs.clientId, clientId), eq(workoutLogs.programDayId, dayId)))
    .orderBy(desc(workoutLogs.performedOn), desc(workoutLogs.createdAt))
    .limit(1);
  if (!prev) return null;

  const rows = await db
    .select()
    .from(setLogs)
    .where(eq(setLogs.workoutLogId, prev.id))
    .orderBy(asc(setLogs.setNo));

  const byExerciseId: Record<string, { setNo: number; weight: string | null; reps: number | null; rpe: string | null }[]> = {};
  for (const r of rows) {
    if (!r.exerciseId) continue;
    (byExerciseId[r.exerciseId] ??= []).push({ setNo: r.setNo, weight: r.weight, reps: r.reps, rpe: r.rpe });
  }
  return { performedOn: prev.performedOn, byExerciseId };
}

/** OWNERSHIP: is this day part of THIS client's active program? */
export async function clientOwnsDay(clientId: string, dayId: string): Promise<boolean> {
  const active = await getActiveProgram(clientId);
  return !!active && active.days.some((d) => d.id === dayId);
}

/** Recent logged workouts for a client (most recent first). */
export async function recentWorkouts(clientId: string, limit = 10) {
  return db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.clientId, clientId))
    .orderBy(desc(workoutLogs.performedOn), desc(workoutLogs.createdAt))
    .limit(limit);
}
