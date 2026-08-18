import "server-only";
import { eq, and, asc, desc } from "drizzle-orm";
import { db, assignments, programs, programDays, programExercises, exercises, workoutLogs } from "@/db";

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
