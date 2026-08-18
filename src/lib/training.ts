"use server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db, exercises, programs, programDays, programExercises, assignments } from "@/db";
import { requireCoach } from "@/lib/auth";

// ── Exercise library ────────────────────────────────────────────────────────
export async function createExercise(_prev: unknown, formData: FormData): Promise<{ ok: boolean; message: string }> {
  await requireCoach();
  const name = z.string().trim().min(1).max(120).safeParse(formData.get("name"));
  if (!name.success) return { ok: false, message: "Exercise name is required." };
  await db.insert(exercises).values({
    name: name.data,
    muscleGroup: str(formData.get("muscleGroup"), 60) || null,
    videoUrl: str(formData.get("videoUrl"), 500) || null,
    cues: str(formData.get("cues"), 1000) || null,
  });
  revalidatePath("/coach/exercises");
  return { ok: true, message: `Added ${name.data}.` };
}

export async function deleteExercise(id: string): Promise<void> {
  await requireCoach();
  await db.delete(exercises).where(eq(exercises.id, id));
  revalidatePath("/coach/exercises");
}

// ── Programs ────────────────────────────────────────────────────────────────
export async function createProgram(_prev: unknown, formData: FormData): Promise<{ ok: boolean; message: string; id?: string }> {
  await requireCoach();
  const name = z.string().trim().min(1).max(120).safeParse(formData.get("name"));
  if (!name.success) return { ok: false, message: "Program name is required." };
  const [row] = await db
    .insert(programs)
    .values({ name: name.data, description: str(formData.get("description"), 500) })
    .returning();
  revalidatePath("/coach/programs");
  return { ok: true, message: "Program created.", id: row.id };
}

export async function addProgramDay(programId: string, title: string): Promise<void> {
  await requireCoach();
  const clean = title.trim().slice(0, 80);
  if (!clean) return;
  const existing = await db.select().from(programDays).where(eq(programDays.programId, programId));
  await db.insert(programDays).values({ programId, title: clean, orderIndex: existing.length });
  revalidatePath(`/coach/programs/${programId}`);
}

export async function deleteProgramDay(dayId: string, programId: string): Promise<void> {
  await requireCoach();
  await db.delete(programDays).where(eq(programDays.id, dayId));
  revalidatePath(`/coach/programs/${programId}`);
}

export async function addExerciseToDay(programId: string, formData: FormData): Promise<void> {
  await requireCoach();
  const dayId = String(formData.get("dayId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");
  if (!dayId || !exerciseId) return;
  const existing = await db.select().from(programExercises).where(eq(programExercises.programDayId, dayId));
  await db.insert(programExercises).values({
    programDayId: dayId,
    exerciseId,
    orderIndex: existing.length,
    targetSets: num(formData.get("targetSets")),
    targetReps: str(formData.get("targetReps"), 20) || null,
    targetRpe: str(formData.get("targetRpe"), 10) || null,
    restSeconds: num(formData.get("restSeconds")),
    notes: str(formData.get("notes"), 300),
  });
  revalidatePath(`/coach/programs/${programId}`);
}

export async function removeProgramExercise(id: string, programId: string): Promise<void> {
  await requireCoach();
  await db.delete(programExercises).where(eq(programExercises.id, id));
  revalidatePath(`/coach/programs/${programId}`);
}

// ── Assignment ──────────────────────────────────────────────────────────────
export async function assignProgram(clientId: string, programId: string): Promise<void> {
  await requireCoach();
  if (!programId) return;
  // One active program per client: deactivate any current, then assign.
  await db.update(assignments).set({ active: false }).where(and(eq(assignments.clientId, clientId), eq(assignments.active, true)));
  await db.insert(assignments).values({ clientId, programId, active: true });
  revalidatePath(`/coach/clients/${clientId}`);
}

// helpers
function str(v: FormDataEntryValue | null, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function num(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return typeof v === "string" && v.trim() && Number.isFinite(n) ? Math.round(n) : null;
}
