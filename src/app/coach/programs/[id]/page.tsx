import { notFound } from "next/navigation";
import { eq, inArray, asc, desc } from "drizzle-orm";
import { db, programs, programDays, programExercises, exercises } from "@/db";
import { requireCoach } from "@/lib/auth";
import { addProgramDay, addExerciseToDay } from "@/lib/training";
import { CoachHeader } from "@/components/CoachHeader";
import { DeleteDayButton, RemoveProgramExerciseButton } from "@/components/TrainingButtons";
import { DeleteProgramButton } from "@/components/DeleteProgramButton";

export default async function ProgramBuilder({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;

  const [program] = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  if (!program) notFound();

  const days = await db.select().from(programDays).where(eq(programDays.programId, id)).orderBy(asc(programDays.orderIndex));
  const dayIds = days.map((d) => d.id);
  const library = await db.select().from(exercises).orderBy(desc(exercises.createdAt));

  const pes = dayIds.length
    ? await db
        .select({
          id: programExercises.id,
          programDayId: programExercises.programDayId,
          orderIndex: programExercises.orderIndex,
          targetSets: programExercises.targetSets,
          targetReps: programExercises.targetReps,
          targetRpe: programExercises.targetRpe,
          restSeconds: programExercises.restSeconds,
          notes: programExercises.notes,
          exerciseName: exercises.name,
        })
        .from(programExercises)
        .innerJoin(exercises, eq(programExercises.exerciseId, exercises.id))
        .where(inArray(programExercises.programDayId, dayIds))
        .orderBy(asc(programExercises.orderIndex))
    : [];

  async function addDay(formData: FormData) {
    "use server";
    await addProgramDay(id, String(formData.get("title") ?? ""));
  }

  return (
    <div className="min-h-dvh">
      <CoachHeader active="programs" />
      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{program.name}</h1>
            {program.description && <p className="text-sm text-fg-muted mt-1">{program.description}</p>}
            <p className="text-xs text-fg-muted mt-1">Workout days repeat weekly. Assign this program to a client from their profile.</p>
          </div>
          <DeleteProgramButton programId={id} />
        </div>

        {days.map((day) => {
          const items = pes.filter((p) => p.programDayId === day.id);
          return (
            <section key={day.id} className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{day.title}</h2>
                <DeleteDayButton dayId={day.id} programId={id} />
              </div>

              <ul className="mt-3 space-y-2">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 border-b border-line/50 pb-2">
                    <div className="text-sm">
                      <span className="font-medium">{it.exerciseName}</span>
                      <span className="text-fg-muted">
                        {" · "}
                        {it.targetSets ?? "?"}×{it.targetReps ?? "?"}
                        {it.targetRpe ? ` @RPE ${it.targetRpe}` : ""}
                        {it.restSeconds ? ` · ${it.restSeconds}s rest` : ""}
                      </span>
                      {it.notes && <p className="text-xs text-fg-muted">{it.notes}</p>}
                    </div>
                    <RemoveProgramExerciseButton id={it.id} programId={id} />
                  </li>
                ))}
                {items.length === 0 && <li className="text-sm text-fg-muted">No exercises yet.</li>}
              </ul>

              {/* Add exercise to this day */}
              <form action={addExerciseToDay.bind(null, id)} className="mt-4 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                <input type="hidden" name="dayId" value={day.id} />
                <div className="col-span-2 sm:col-span-2">
                  <label className="label text-xs">Exercise</label>
                  <select name="exerciseId" required defaultValue="" className="input">
                    <option value="" disabled>Choose…</option>
                    {library.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div><label className="label text-xs">Sets</label><input name="targetSets" inputMode="numeric" className="input" /></div>
                <div><label className="label text-xs">Reps</label><input name="targetReps" placeholder="8–12" className="input" /></div>
                <div><label className="label text-xs">RPE</label><input name="targetRpe" className="input" /></div>
                <div><button className="btn btn-ghost text-sm w-full">Add</button></div>
              </form>
              {library.length === 0 && (
                <p className="mt-2 text-xs text-amber-500">Add exercises to your library first (Exercises tab).</p>
              )}
            </section>
          );
        })}

        {/* Add a workout day */}
        <form action={addDay} className="card p-5 flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Add a workout day</label>
            <input name="title" required placeholder="Day A — Upper Body" className="input" />
          </div>
          <button className="btn btn-primary">Add day</button>
        </form>
      </main>
    </div>
  );
}
