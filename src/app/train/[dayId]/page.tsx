import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getMyClientRecord } from "@/lib/auth";
import { clientOwnsDay, getDayWithExercises, lastSessionForDay } from "@/lib/client-training";
import { WorkoutLogger } from "@/components/WorkoutLogger";

export default async function LogDay({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await params;
  const client = await getMyClientRecord();
  if (!client) redirect("/");
  if (client.status !== "ACTIVE") redirect("/");

  // OWNERSHIP: server-side check that this day belongs to the client's program.
  if (!(await clientOwnsDay(client.id, dayId))) notFound();

  const day = await getDayWithExercises(dayId);
  if (!day) notFound();

  const last = await lastSessionForDay(client.id, dayId);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto max-w-xl h-16 px-5 flex items-center justify-between">
          <Link href="/train" className="text-sm text-fg-muted hover:text-fg">← Training</Link>
          <span className="eyebrow">4HR</span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-6">
        <h1 className="text-2xl font-bold mb-1">{day.day.title}</h1>
        <p className="text-sm text-fg-muted mb-5">Log each set as you train. Only filled sets are saved.</p>

        {day.items.length === 0 ? (
          <div className="card p-6 text-center text-sm text-fg-muted">
            No exercises in this day yet. Check back once your coach adds them.
          </div>
        ) : (
          <WorkoutLogger
            dayId={dayId}
            dayTitle={day.day.title}
            items={day.items}
            lastByExerciseId={last?.byExerciseId ?? {}}
            lastPerformedOn={last?.performedOn ?? null}
          />
        )}
      </main>
    </div>
  );
}
