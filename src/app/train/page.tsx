import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyClientRecord } from "@/lib/auth";
import { getTrainingOverview, formatDay, type DayOverview } from "@/lib/client-training";
import { ClientShell } from "@/components/ClientShell";

export default async function TrainingTab() {
  const client = await getMyClientRecord();
  if (!client) redirect("/");
  if (client.status !== "ACTIVE") redirect("/");

  const o = await getTrainingOverview(client);
  const upNext = o.days.find((d) => d.id === o.upNextId) ?? null;
  const others = o.days.filter((d) => d.id !== o.upNextId);

  return (
    <ClientShell active="training">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Training</h1>
        {o.program && (
          <p className="mt-1 text-sm text-fg">
            <span className="font-medium">{o.program.name}</span>
            {o.coachName && <span className="text-fg-muted"> · with {o.coachName}</span>}
          </p>
        )}
        {o.week && (
          <div className="mt-4 max-w-[16rem]">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium">Week {o.week.current}{o.week.total ? <span className="text-fg-muted"> of {o.week.total}</span> : null}</span>
              {o.week.total && <span className="text-fg-muted tabular-nums">{Math.round(o.week.fraction * 100)}%</span>}
            </div>
            {o.week.total && (
              <div className="mt-1.5 h-1.5 rounded-full bg-line overflow-hidden" role="progressbar" aria-valuenow={o.week.current} aria-valuemin={1} aria-valuemax={o.week.total} aria-label="Program progress">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, o.week.fraction * 100)}%` }} />
              </div>
            )}
          </div>
        )}
      </section>

      {!o.program ? (
        <div className="mt-7 card p-8 text-center">
          <p className="font-semibold">Your coach is finalizing your program</p>
          <p className="mt-1.5 text-sm text-fg-muted">Your workout days will appear here as soon as it&apos;s ready.</p>
        </div>
      ) : o.days.length === 0 ? (
        <div className="mt-7 card p-8 text-center text-sm text-fg-muted">No workout days have been added yet.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {upNext && <UpNextCard day={upNext} />}
          {others.length > 0 && (
            <section aria-label="Workout days">
              {upNext && <h2 className="eyebrow mb-2 mt-4">All workouts</h2>}
              <ul className="space-y-2.5">
                {others.map((d) => (
                  <li key={d.id}><DayCard day={d} /></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </ClientShell>
  );
}

function UpNextCard({ day }: { day: DayOverview }) {
  return (
    <Link href={`/train/${day.id}`} className="group block card p-5 sm:p-6 border-brand/40 shadow-[0_10px_40px_-12px_rgba(196,106,45,0.35)] transition-colors hover:border-brand focus-visible:border-brand">
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

function DayCard({ day }: { day: DayOverview }) {
  return (
    <Link href={`/train/${day.id}`} className="group flex items-center justify-between gap-4 card p-4 transition-colors hover:border-fg-muted focus-visible:border-fg-muted">
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
        {day.completedThisWeek ? "Log again" : "Start"}
      </span>
    </Link>
  );
}

function CheckBadge() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-fg-muted/50 text-fg-muted" aria-label="Completed this week">
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M2.5 6.5 5 9l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
