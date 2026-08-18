import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getMyClientRecord } from "@/lib/auth";
import { getActiveProgram, recentWorkouts } from "@/lib/client-training";

function weekOf(startDate: string | null, endDate: string | null): string | null {
  if (!startDate) return null;
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const week = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (7 * 864e5)) + 1);
  if (endDate) {
    const total = Math.max(1, Math.round((new Date(endDate + "T00:00:00").getTime() - start.getTime()) / (7 * 864e5)));
    return `Week ${Math.min(week, total)} of ${total}`;
  }
  return `Week ${week}`;
}

export default async function TrainHome() {
  const client = await getMyClientRecord();
  if (!client) redirect("/");
  if (client.status !== "ACTIVE") redirect("/");

  const active = await getActiveProgram(client.id);
  const logs = await recentWorkouts(client.id, 5);
  const week = weekOf(client.startDate, client.endDate);

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-5 h-16 border-b border-line">
        <span className="eyebrow">4HR · Training</span>
        <UserButton />
      </header>

      <main className="mx-auto max-w-lg px-5 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Your training</h1>
          {week && <p className="mt-1 text-sm text-fg-muted">{week}</p>}
        </div>

        {!active ? (
          <div className="card p-6 text-center">
            <p className="font-medium">Your coach is finalizing your program.</p>
            <p className="mt-1 text-sm text-fg-muted">You'll see your workout days here as soon as it's ready.</p>
          </div>
        ) : (
          <section className="space-y-3">
            <p className="eyebrow">{active.program?.name ?? "Program"} · repeats weekly</p>
            {active.days.length === 0 && (
              <div className="card p-6 text-center text-sm text-fg-muted">No workout days set yet.</div>
            )}
            {active.days.map((d) => (
              <Link
                key={d.id}
                href={`/train/${d.id}`}
                className="card p-5 flex items-center justify-between hover:border-fg-muted transition-colors"
              >
                <span className="font-semibold">{d.title}</span>
                <span className="btn btn-ghost text-xs pointer-events-none">Log →</span>
              </Link>
            ))}
          </section>
        )}

        {logs.length > 0 && (
          <section>
            <h2 className="eyebrow mb-2">Recent workouts</h2>
            <ul className="space-y-2">
              {logs.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm border-b border-line/50 pb-2">
                  <span>{l.dayTitle ?? "Workout"}</span>
                  <span className="text-fg-muted tabular-nums">{l.performedOn}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
