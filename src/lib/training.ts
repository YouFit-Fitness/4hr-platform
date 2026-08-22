"use server";
import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
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
    equipment: str(formData.get("equipment"), 40) || null,
    movementCategory: str(formData.get("movementCategory"), 40) || null,
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

/** Archive/unarchive an exercise — hides it from pickers without touching history. */
export async function setExerciseArchived(id: string, archived: boolean): Promise<void> {
  await requireCoach();
  await db.update(exercises).set({ archived }).where(eq(exercises.id, id));
  revalidatePath("/coach/exercises");
}

/** Edit a master exercise's details in place (does not affect logged history). */
export async function updateExercise(id: string, _prev: unknown, formData: FormData): Promise<{ ok: boolean; message: string }> {
  await requireCoach();
  const name = z.string().trim().min(1).max(120).safeParse(formData.get("name"));
  if (!name.success) return { ok: false, message: "Exercise name is required." };
  await db
    .update(exercises)
    .set({
      name: name.data,
      muscleGroup: str(formData.get("muscleGroup"), 60) || null,
      equipment: str(formData.get("equipment"), 40) || null,
      movementCategory: str(formData.get("movementCategory"), 40) || null,
      videoUrl: str(formData.get("videoUrl"), 500) || null,
      cues: str(formData.get("cues"), 1000) || null,
    })
    .where(eq(exercises.id, id));
  revalidatePath("/coach/exercises");
  return { ok: true, message: "Saved." };
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

export async function deleteProgram(_prev: unknown, formData: FormData): Promise<{ ok: boolean; message: string }> {
  await requireCoach();
  const id = String(formData.get("programId") ?? "");
  if (!id) return { ok: false, message: "Missing program." };
  // Guard: a program that's been assigned to any client can't be deleted (it's
  // referenced by their history). Days/exercises cascade-delete otherwise.
  const refs = await db.select({ id: assignments.id }).from(assignments).where(eq(assignments.programId, id)).limit(1);
  if (refs.length) {
    return { ok: false, message: "This program is assigned to a client, so it can't be deleted. Unassign it first." };
  }
  await db.delete(programs).where(eq(programs.id, id));
  revalidatePath("/coach/programs");
  return { ok: true, message: "Program deleted." };
}

/** Deep-copy a program (days + prescriptions). Returns the new program id. */
export async function duplicateProgram(programId: string): Promise<{ ok: boolean; id?: string }> {
  await requireCoach();
  const [p] = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
  if (!p) return { ok: false };
  const [np] = await db.insert(programs).values({ name: `${p.name} (copy)`, description: p.description }).returning({ id: programs.id });
  const days = await db.select().from(programDays).where(eq(programDays.programId, programId)).orderBy(asc(programDays.orderIndex));
  for (const d of days) {
    const [nd] = await db.insert(programDays).values({ programId: np.id, title: d.title, orderIndex: d.orderIndex }).returning({ id: programDays.id });
    await copyDayExercises(d.id, nd.id);
  }
  revalidatePath("/coach/programs");
  return { ok: true, id: np.id };
}

/** Copy one day (with its prescriptions) into the same program. */
export async function duplicateProgramDay(dayId: string, programId: string): Promise<void> {
  await requireCoach();
  const [d] = await db.select().from(programDays).where(eq(programDays.id, dayId)).limit(1);
  if (!d) return;
  const siblings = await db.select({ id: programDays.id }).from(programDays).where(eq(programDays.programId, programId));
  const [nd] = await db.insert(programDays).values({ programId, title: `${d.title} (copy)`, orderIndex: siblings.length }).returning({ id: programDays.id });
  await copyDayExercises(dayId, nd.id);
  revalidatePath(`/coach/programs/${programId}`);
}

async function copyDayExercises(fromDayId: string, toDayId: string): Promise<void> {
  const pes = await db.select().from(programExercises).where(eq(programExercises.programDayId, fromDayId)).orderBy(asc(programExercises.orderIndex));
  if (!pes.length) return;
  await db.insert(programExercises).values(
    pes.map((pe) => ({
      programDayId: toDayId,
      exerciseId: pe.exerciseId,
      orderIndex: pe.orderIndex,
      targetSets: pe.targetSets,
      targetReps: pe.targetReps,
      targetRpe: pe.targetRpe,
      tempo: pe.tempo,
      restSeconds: pe.restSeconds,
      notes: pe.notes,
    })),
  );
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

/** Add a master exercise (by reference) to a day, with a client-specific prescription. */
export async function addExerciseToProgramDay(
  programId: string,
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  await requireCoach();
  const dayId = String(formData.get("dayId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");
  if (!dayId || !exerciseId) return { ok: false, message: "Choose an exercise first." };
  const existing = await db.select({ id: programExercises.id }).from(programExercises).where(eq(programExercises.programDayId, dayId));
  await db.insert(programExercises).values({
    programDayId: dayId,
    exerciseId, // references the master exercise — never copies it
    orderIndex: existing.length,
    targetSets: num(formData.get("targetSets")),
    targetReps: str(formData.get("targetReps"), 20) || null,
    targetRpe: str(formData.get("targetRpe"), 10) || null,
    tempo: str(formData.get("tempo"), 20) || null,
    restSeconds: num(formData.get("restSeconds")),
    notes: str(formData.get("notes"), 300),
  });
  revalidatePath(`/coach/programs/${programId}`);
  return { ok: true, message: "Added." };
}

export async function removeProgramExercise(id: string, programId: string): Promise<void> {
  await requireCoach();
  await db.delete(programExercises).where(eq(programExercises.id, id));
  revalidatePath(`/coach/programs/${programId}`);
}

/** Edit a client-specific prescription in place (the master exercise is untouched). */
export async function updateProgramExercise(
  id: string,
  programId: string,
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  await requireCoach();
  await db
    .update(programExercises)
    .set({
      targetSets: num(formData.get("targetSets")),
      targetReps: str(formData.get("targetReps"), 20) || null,
      targetRpe: str(formData.get("targetRpe"), 10) || null,
      tempo: str(formData.get("tempo"), 20) || null,
      restSeconds: num(formData.get("restSeconds")),
      notes: str(formData.get("notes"), 300),
    })
    .where(eq(programExercises.id, id));
  revalidatePath(`/coach/programs/${programId}`);
  return { ok: true, message: "Saved." };
}

/** Reorder an exercise within its day by swapping orderIndex with a neighbour. */
export async function moveProgramExercise(id: string, programId: string, dir: "up" | "down"): Promise<void> {
  await requireCoach();
  const [me] = await db.select().from(programExercises).where(eq(programExercises.id, id)).limit(1);
  if (!me) return;
  const siblings = await db
    .select()
    .from(programExercises)
    .where(eq(programExercises.programDayId, me.programDayId))
    .orderBy(asc(programExercises.orderIndex));
  const idx = siblings.findIndex((s) => s.id === id);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return;
  const other = siblings[swapIdx];
  await db.update(programExercises).set({ orderIndex: other.orderIndex }).where(eq(programExercises.id, me.id));
  await db.update(programExercises).set({ orderIndex: me.orderIndex }).where(eq(programExercises.id, other.id));
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
