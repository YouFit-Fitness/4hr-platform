"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, workoutLogs, setLogs } from "@/db";
import { getMyClientRecord } from "@/lib/auth";
import { clientOwnsDay, getDayWithExercises } from "@/lib/client-training";

const setSchema = z.object({
  weight: z.string().trim().max(20).optional().default(""),
  reps: z.coerce.number().int().min(0).max(1000).optional(),
  rpe: z.string().trim().max(10).optional().default(""),
});
const payloadSchema = z.array(
  z.object({
    exerciseId: z.string().uuid().optional(),
    exerciseName: z.string().trim().min(1).max(200),
    sets: z.array(setSchema).max(30),
  }),
).max(30);

/**
 * CLIENT: log a completed workout for one of THEIR program days.
 * Ownership is enforced server-side — a client can only log against a day in
 * their own active program. Empty sets are ignored.
 */
export async function logWorkout(
  dayId: string,
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const client = await getMyClientRecord();
  if (!client || client.status !== "ACTIVE") {
    return { ok: false, message: "Your portal isn't active. Contact your coach." };
  }
  if (!(await clientOwnsDay(client.id, dayId))) {
    return { ok: false, message: "That workout isn't part of your program." };
  }

  const parsed = payloadSchema.safeParse(safeJson(formData.get("payload")));
  if (!parsed.success) return { ok: false, message: "Couldn't read your entries. Please try again." };

  // Build the filled sets first — a workout with no logged sets is not saved.
  const filled = parsed.data.map((ex) => ({
    ...ex,
    sets: ex.sets.filter((s) => (s.weight && s.weight.length) || s.reps != null || (s.rpe && s.rpe.length)),
  }));
  if (!filled.some((ex) => ex.sets.length > 0)) {
    return { ok: false, message: "Log at least one set before completing." };
  }

  const day = await getDayWithExercises(dayId);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
  const performedOn =
    String(formData.get("performedOn") ?? "").trim() || new Date().toISOString().slice(0, 10);

  const [log] = await db
    .insert(workoutLogs)
    .values({
      clientId: client.id,
      programDayId: dayId,
      dayTitle: day?.day.title ?? "Workout",
      performedOn,
      completedAt: new Date(),
      notes,
    })
    .returning({ id: workoutLogs.id });

  const rows = filled.flatMap((ex) =>
    ex.sets.map((s, i) => ({
      workoutLogId: log.id,
      exerciseId: ex.exerciseId ?? null,
      exerciseName: ex.exerciseName,
      setNo: i + 1,
      weight: s.weight || null,
      reps: s.reps ?? null,
      rpe: s.rpe || null,
    })),
  );
  await db.insert(setLogs).values(rows);

  revalidatePath("/train");
  return { ok: true, message: "Workout logged. Great work." };
}

function safeJson(v: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(typeof v === "string" ? v : "[]");
  } catch {
    return [];
  }
}
