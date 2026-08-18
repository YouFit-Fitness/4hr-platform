import { desc } from "drizzle-orm";
import { db, exercises } from "@/db";
import { requireCoach } from "@/lib/auth";
import { CoachHeader } from "@/components/CoachHeader";
import { AddExerciseForm } from "@/components/AddExerciseForm";
import { DeleteExerciseButton } from "@/components/TrainingButtons";

export default async function ExerciseLibrary() {
  await requireCoach();
  const list = await db.select().from(exercises).orderBy(desc(exercises.createdAt));

  return (
    <div className="min-h-dvh">
      <CoachHeader active="exercises" />
      <main className="mx-auto max-w-4xl px-6 py-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h1 className="text-2xl font-bold">Exercise library</h1>
          <p className="text-sm text-fg-muted mt-1">{list.length} exercises · reusable across programs</p>
          <div className="mt-5 space-y-2">
            {list.map((e) => (
              <div key={e.id} className="card p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {e.muscleGroup || "—"}
                    {e.videoUrl && (
                      <>
                        {" · "}
                        <a href={e.videoUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                          demo video
                        </a>
                      </>
                    )}
                  </p>
                  {e.cues && <p className="text-xs text-fg-muted mt-1">{e.cues}</p>}
                </div>
                <DeleteExerciseButton id={e.id} />
              </div>
            ))}
            {list.length === 0 && <p className="text-fg-muted text-sm">No exercises yet — add your first one.</p>}
          </div>
        </section>

        <aside>
          <div className="sticky top-6">
            <AddExerciseForm />
          </div>
        </aside>
      </main>
    </div>
  );
}
