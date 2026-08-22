import { asc } from "drizzle-orm";
import { db, exercises } from "@/db";
import { requireCoach } from "@/lib/auth";
import { CoachHeader } from "@/components/CoachHeader";
import { AddExerciseForm } from "@/components/AddExerciseForm";
import { ExerciseBrowser } from "@/components/ExerciseBrowser";

export default async function ExerciseLibrary() {
  await requireCoach();
  const list = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      equipment: exercises.equipment,
      movementCategory: exercises.movementCategory,
      videoUrl: exercises.videoUrl,
      cues: exercises.cues,
      archived: exercises.archived,
    })
    .from(exercises)
    .orderBy(asc(exercises.name));

  return (
    <div className="min-h-dvh">
      <CoachHeader active="exercises" />
      <main className="mx-auto max-w-4xl px-6 py-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ExerciseBrowser exercises={list} />

        <aside>
          <div className="sticky top-6">
            <AddExerciseForm />
          </div>
        </aside>
      </main>
    </div>
  );
}
