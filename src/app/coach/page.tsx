import Link from "next/link";
import { desc, max } from "drizzle-orm";
import { db, clients, workoutLogs } from "@/db";
import { requireCoach, isCoachEmailConfigured } from "@/lib/auth";
import { InviteForm } from "@/components/InviteForm";
import { CoachHeader } from "@/components/CoachHeader";

const STATUS_ORDER = ["ONBOARDING", "PLAN_SETUP", "INVITED", "ACTIVE", "PAUSED", "COMPLETED"] as const;
const STATUS_LABEL: Record<string, string> = {
  INVITED: "Invited", ONBOARDING: "Onboarding", PLAN_SETUP: "Plan setup",
  ACTIVE: "Active", PAUSED: "Paused", COMPLETED: "Completed",
};

function daysAgo(d: string): number {
  return Math.floor((Date.now() - new Date(d.slice(0, 10) + "T00:00:00").getTime()) / 864e5);
}
function relLabel(days: number): string {
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days}d ago`;
}

export default async function CoachHome() {
  await requireCoach();
  const all = await db.select().from(clients).orderBy(desc(clients.updatedAt));
  const byStatus = (s: string) => all.filter((c) => c.status === s);

  // Most recent training date per client (for the "who needs attention" cue).
  const lastRows = await db
    .select({ clientId: workoutLogs.clientId, last: max(workoutLogs.performedOn) })
    .from(workoutLogs)
    .groupBy(workoutLogs.clientId);
  const lastTrained = new Map(lastRows.map((r) => [r.clientId, r.last as string | null]));

  function rightMeta(c: (typeof all)[number]) {
    if (c.status === "ACTIVE") {
      const last = lastTrained.get(c.id);
      if (!last) return <span className="text-xs text-fg-muted whitespace-nowrap">No workouts yet</span>;
      const d = daysAgo(last);
      const quiet = d >= 5;
      return (
        <span className={`text-xs whitespace-nowrap ${quiet ? "text-amber-500" : "text-fg-muted"}`}>
          Trained {relLabel(d)}{quiet ? " · quiet" : ""}
        </span>
      );
    }
    return <span className="text-xs text-fg-muted whitespace-nowrap">{new Date(c.updatedAt).toLocaleDateString()}</span>;
  }

  return (
    <div className="min-h-dvh">
      <CoachHeader active="clients" />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-sm text-fg-muted mt-1">{all.length} total · needs attention shown first</p>
          </div>
          <div className="w-full sm:w-80">
            <InviteForm />
          </div>
        </div>

        {!isCoachEmailConfigured() && (
          <p className="mt-4 text-xs text-amber-500">
            Setup note: COACH_EMAIL is not set — new sign-ins default to CLIENT. Set it so your account is the coach.
          </p>
        )}

        <div className="mt-8 space-y-8">
          {STATUS_ORDER.map((status) => {
            const rows = byStatus(status);
            if (rows.length === 0) return null;
            return (
              <section key={status}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">
                  {STATUS_LABEL[status]} · {rows.length}
                </h2>
                <div className="space-y-2">
                  {rows.map((c) => (
                    <Link
                      key={c.id}
                      href={`/coach/clients/${c.id}`}
                      className="card card p-4 flex items-center justify-between hover:border-fg-muted transition-colors"
                    >
                      <span className="font-medium truncate">{c.email}</span>
                      {rightMeta(c)}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
          {all.length === 0 && <p className="text-fg-muted">No clients yet. Invite your first client above.</p>}
        </div>
      </main>
    </div>
  );
}
