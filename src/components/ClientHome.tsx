import Link from "next/link";
import type { Client } from "@/db";
import { getTrainingOverview, formatDay } from "@/lib/client-training";
import { getActiveNutritionPlan, hasNutritionContent } from "@/lib/nutrition";
import { ClientShell } from "@/components/ClientShell";

/** The client's Home: what's next across training + nutrition. */
export async function ClientHome({ client, firstName }: { client: Client; firstName: string | null }) {
  const o = await getTrainingOverview(client);
  const plan = await getActiveNutritionPlan(client.id);
  const upNext = o.days.find((d) => d.id === o.upNextId) ?? null;
  const nutritionReady = hasNutritionContent(plan);

  return (
    <ClientShell active="home" name={firstName}>
      <section>
        <h1 className="text-2xl font-bold tracking-tight">{firstName ? `Hi, ${firstName}` : "Welcome back"}</h1>
        {o.program && <p className="mt-1 text-sm text-fg-muted">{o.program.name}</p>}
        {o.week && (
          <div className="mt-4 max-w-[16rem]">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium">Week {o.week.current}{o.week.total ? <span className="text-fg-muted"> of {o.week.total}</span> : null}</span>
              {o.week.total && <span className="text-fg-muted tabular-nums">{Math.round(o.week.fraction * 100)}%</span>}
            </div>
            {o.week.total && (
              <div className="mt-1.5 h-1.5 rounded-full bg-line overflow-hidden">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, o.week.fraction * 100)}%` }} />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Up next workout */}
      <section className="mt-6">
        <h2 className="eyebrow mb-2">Up next</h2>
        {!o.program ? (
          <div className="card p-6 text-center text-sm text-fg-muted">Your coach is finalizing your program.</div>
        ) : upNext ? (
          <Link href={`/train/${upNext.id}`} className="group block card p-5 border-brand/40 shadow-[0_10px_40px_-12px_rgba(196,106,45,0.35)] transition-colors hover:border-brand">
            <h3 className="text-xl font-bold">{upNext.title}</h3>
            <p className="mt-1 text-sm text-fg-muted">
              {upNext.exerciseCount} {upNext.exerciseCount === 1 ? "exercise" : "exercises"}
              {upNext.lastPerformed ? <> · last done {formatDay(upNext.lastPerformed)}</> : <> · not started yet</>}
            </p>
            <span className="btn btn-primary mt-4 w-full sm:w-auto sm:px-8">Start workout</span>
          </Link>
        ) : (
          <div className="card p-5">
            <p className="font-medium">This week&apos;s sessions are done ✓</p>
            <Link href="/train" className="mt-2 inline-block text-sm text-brand hover:underline">View your training →</Link>
          </div>
        )}
      </section>

      {/* Nutrition snapshot */}
      <section className="mt-6">
        <h2 className="eyebrow mb-2">Nutrition</h2>
        <Link href="/nutrition" className="block card p-5 hover:border-fg-muted transition-colors">
          {nutritionReady ? (
            <>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Mini label="Cal" value={plan!.calories} />
                <Mini label="Protein" value={plan!.protein} unit="g" />
                <Mini label="Carbs" value={plan!.carbs} unit="g" />
                <Mini label="Fat" value={plan!.fat} unit="g" />
              </div>
              <span className="mt-3 inline-block text-sm text-brand">View your plan →</span>
            </>
          ) : (
            <p className="text-sm text-fg-muted">Your nutrition plan is being prepared — tap to check back.</p>
          )}
        </Link>
      </section>

      {/* Recent activity */}
      {o.recent.length > 0 && (
        <section className="mt-6">
          <h2 className="eyebrow mb-2">Recent workouts</h2>
          <ul className="card divide-y divide-line/70 px-4">
            {o.recent.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.dayTitle ?? "Workout"}</p>
                  <p className="text-xs text-fg-muted">{r.setCount} {r.setCount === 1 ? "set" : "sets"} logged</p>
                </div>
                <span className="text-xs text-fg-muted whitespace-nowrap">{formatDay(r.performedOn)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ClientShell>
  );
}

function Mini({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <div>
      <p className="text-lg font-bold tabular-nums">{value ?? "—"}</p>
      <p className="text-[10px] uppercase tracking-wide text-fg-muted">{label}{value != null && unit ? ` ${unit}` : ""}</p>
    </div>
  );
}
