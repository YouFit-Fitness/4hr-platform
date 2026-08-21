import { notFound } from "next/navigation";
import { eq, inArray, asc } from "drizzle-orm";
import { db, programs, programDays, programExercises, exercises } from "@/db";
import { requireCoach } from "@/lib/auth";
import { addProgramDay } from "@/lib/training";
import { CoachHeader } from "@/components/CoachHeader";
import { DeleteDayButton, RemoveProgramExerciseButton, MoveExerciseButtons } from "@/components/TrainingButtons";
import { DeleteProgramButton } from "@/components/DeleteProgramButton";
import { AddExerciseToDay } from "@/components/AddExerciseToDay";

export default async function ProgramBuilder({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;

  const [program] = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  if (!program) notFound();

  const days = await db.select().from(programDays).where(eq(programDays.programId, id)).orderBy(asc(programDays.orderIndex));
  const dayIds = days.map((d) => d.id);
  const library = await db
    .select({ id: exercises.id, name: exercises.name, muscleGroup: exercises.muscleGroup, equipment: exercises.equipment })
    .from(exercises)
    .where(eq(exercises.archived, false))
    .orderBy(asc(exercises.name));

  const pes = dayIds.length
    ? await db
        .select({
          id: programExercises.id,
          programDayId: programExercises.programDayId,
          orderIndex: programExercises.orderIndex,
          targetSets: programExercises.targetSets,
          targetReps: programExercises.targetReps,
          targetRpe: programExercises.targetRpe,
          tempo: programExercises.tempo,
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
                {items.map((it, i) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 border-b border-line/50 pb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <MoveExerciseButtons id={it.id} programId={id} isFirst={i === 0} isLast={i === items.length - 1} />
                      <div className="text-sm min-w-0">
                        <span className="font-medium">{it.exerciseName}</span>
                        <span className="text-fg-muted">
                          {" · "}
                          {it.targetSets ?? "?"}×{it.targetReps ?? "?"}
                          {it.targetRpe ? ` @RPE ${it.targetRpe}` : ""}
                          {it.tempo ? ` · tempo ${it.tempo}` : ""}
                          {it.restSeconds ? ` · ${it.restSeconds}s rest` : ""}
                        </span>
                        {it.notes && <p className="text-xs text-fg-muted">{it.notes}</p>}
                      </div>
                    </div>
                    <RemoveProgramExerciseButton id={it.id} programId={id} />
                  </li>
                ))}
                {items.length === 0 && <li className="text-sm text-fg-muted">No exercises yet.</li>}
              </ul>

              {library.length === 0 ? (
                <p className="mt-2 text-xs text-amber-500">Add exercises to your library first (Exercises tab).</p>
              ) : (
                <AddExerciseToDay programId={id} dayId={day.id} library={library} />
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
