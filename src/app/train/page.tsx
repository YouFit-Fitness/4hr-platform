import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getMyClientRecord } from "@/lib/auth";
import { getTrainingOverview, formatDay, type DayOverview } from "@/lib/client-training";

export default async function TrainHome() {
  const client = await getMyClientRecord();
  if (!client) redirect("/");
  if (client.status !== "ACTIVE") redirect("/");

  const o = await getTrainingOverview(client);
  const upNext = o.days.find((d) => d.id === o.upNextId) ?? null;
  const others = o.days.filter((d) => d.id !== o.upNextId);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto max-w-4xl h-16 px-5 sm:px-6 flex items-center justify-between">
          <span className="eyebrow">4HR · Training</span>
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 sm:px-6 py-7 sm:py-9">
        {/* Orientation: who / which program / where in the plan */}
        <section>
          <h1 className="text-3xl font-bold tracking-tight">Your training</h1>
          {o.program && (
            <p className="mt-1.5 text-sm text-fg">
              <span className="font-medium">{o.program.name}</span>
              {o.coachName && <span className="text-fg-muted"> · with {o.coachName}</span>}
            </p>
          )}
          {o.week && (
            <div className="mt-4 max-w-[16rem]">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium">
                  Week {o.week.current}
                  {o.week.total ? <span className="text-fg-muted"> of {o.week.total}</span> : null}
                </span>
                {o.week.total && <span className="text-fg-muted tabular-nums">{Math.round(o.week.fraction * 100)}%</span>}
              </div>
              {o.week.total && (
                <div className="mt-1.5 h-1.5 rounded-full bg-line overflow-hidden" role="progressbar" aria-valuenow={o.week.current} aria-valuemin={1} aria-valuemax={o.week.total} aria-label="Program progress">
                  <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${Math.max(4, o.week.fraction * 100)}%` }} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* No program yet */}
        {!o.program ? (
          <div className="mt-7 card p-8 text-center">
            <p className="font-semibold">Your coach is finalizing your program</p>
            <p className="mt-1.5 text-sm text-fg-muted">Your workout days will appear here as soon as it&apos;s ready.</p>
          </div>
        ) : o.days.length === 0 ? (
          <div className="mt-7 card p-8 text-center text-sm text-fg-muted">
            No workout days have been added to this program yet.
          </div>
        ) : (
          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8 lg:items-start">
            {/* Main column: what to do */}
            <div className="space-y-6">
              {upNext ? (
                <UpNextCard day={upNext} />
              ) : (
                <div className="card p-6 border-brand/30">
                  <div className="flex items-center gap-2">
                    <CheckBadge />
                    <p className="font-semibold">This week&apos;s sessions are done</p>
                  </div>
                  <p className="mt-1.5 text-sm text-fg-muted">Nice work. You can repeat any session below whenever you train again.</p>
                </div>
              )}

              {others.length > 0 && (
                <section aria-label="Workout days">
                  <h2 className="eyebrow mb-3">{upNext ? "Your other workouts" : "Your workouts"}</h2>
                  <ul className="space-y-2.5">
                    {others.map((d) => (
                      <li key={d.id}>
                        <DayCard day={d} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Context column: recent history (real data only) */}
            <aside aria-label="Recent workouts">
              <h2 className="eyebrow mb-3">Recent workouts</h2>
              {o.recent.length === 0 ? (
                <div className="card p-5 text-sm text-fg-muted">
                  <p className="font-medium text-fg">No workouts completed yet</p>
                  <p className="mt-1">Your completed sessions will show up here.</p>
                </div>
              ) : (
                <ul className="card divide-y divide-line/70 px-4">
                  {o.recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.dayTitle ?? "Workout"}</p>
                        <p className="text-xs text-fg-muted">{r.setCount} {r.setCount === 1 ? "set" : "sets"} logged</p>
                      </div>
                      <span className="text-xs text-fg-muted whitespace-nowrap">{formatDay(r.performedOn)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Up next: the single, prominent primary action ─────────────────────────── */
function UpNextCard({ day }: { day: DayOverview }) {
  return (
    <Link
      href={`/train/${day.id}`}
      className="group block card p-5 sm:p-6 border-brand/40 shadow-[0_10px_40px_-12px_rgba(196,106,45,0.35)] transition-colors hover:border-brand focus-visible:border-brand"
    >
      <p className="eyebrow">Up next</p>
      <h2 className="mt-1.5 text-xl sm:text-2xl font-bold">{day.title}</h2>
      <p className="mt-1.5 text-sm text-fg-muted">
        {day.exerciseCount} {day.exerciseCount === 1 ? "exercise" : "exercises"}
        {day.lastPerformed ? <> · last done {formatDay(day.lastPerformed)}</> : <> · not started yet</>}
      </p>
      <span className="btn btn-primary mt-5 w-full sm:w-auto sm:px-8 group-hover:shadow-lg">Start workout</span>
    </Link>
  );
}

/* ── Secondary day card: whole card is the tap target ──────────────────────── */
function DayCard({ day }: { day: DayOverview }) {
  return (
    <Link
      href={`/train/${day.id}`}
      className="group flex items-center justify-between gap-4 card p-4 transition-colors hover:border-fg-muted focus-visible:border-fg-muted"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {day.completedThisWeek && <CheckBadge />}
          <span className="font-semibold truncate">{day.title}</span>
        </div>
        <p className="mt-0.5 text-xs text-fg-muted">
          {day.exerciseCount} {day.exerciseCount === 1 ? "exercise" : "exercises"}
          {day.completedThisWeek ? <> · done this week</> : day.lastPerformed ? <> · last {formatDay(day.lastPerformed)}</> : null}
        </p>
      </div>
      <span className="btn btn-ghost text-xs whitespace-nowrap shrink-0 group-hover:border-brand">
        {day.completedThisWeek ? "Log again" : "Start workout"}
      </span>
    </Link>
  );
}

/* Subtle completion mark — intentionally muted (no gamification, no orange). */
function CheckBadge() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-fg-muted/50 text-fg-muted" aria-label="Completed this week">
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M2.5 6.5 5 9l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
