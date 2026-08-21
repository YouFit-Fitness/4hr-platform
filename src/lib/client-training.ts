import "server-only";
import { eq, and, asc, desc } from "drizzle-orm";
import { db, assignments, programs, programDays, programExercises, exercises, workoutLogs, setLogs } from "@/db";

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
