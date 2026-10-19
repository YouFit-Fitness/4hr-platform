import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getSessionUser, getMyClientRecord, isCoachEmailConfigured } from "@/lib/auth";
import { getActiveProgram } from "@/lib/client-training";
import { ClientHome } from "@/components/ClientHome";
import { whatsappLink } from "@/lib/contact";

function totalWeeks(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start.slice(0, 10) + "T00:00:00").getTime();
  const e = new Date(end.slice(0, 10) + "T00:00:00").getTime();
  return Math.max(1, Math.round((e - s) / (7 * 864e5)));
}

/** Root dispatcher: routes each user to the right place by role + client status. */
export default async function Home() {
  const user = await getSessionUser();

  if (user.role === "COACH") redirect("/coach");

  const client = await getMyClientRecord();

  // Client hasn't been set up (edge case — invited via Clerk but no client record).
  if (!client) {
    return (
      <Shell name={user.firstName}>
        <h1 className="text-2xl font-bold">You&apos;re signed in</h1>
        <p className="mt-3 text-fg-muted">
          Your coaching record isn&apos;t set up yet. Please contact Youssef and he&apos;ll get you started.
        </p>
        {!isCoachEmailConfigured() && (
          <p className="mt-4 text-xs text-fg-muted/70">(Setup note: COACH_EMAIL is not configured.)</p>
        )}
      </Shell>
    );
  }

  if (client.status === "INVITED" || client.status === "ONBOARDING") redirect("/onboarding");

  if (client.status === "PLAN_SETUP") {
    return (
      <Shell name={user.firstName}>
        <p className="eyebrow">Onboarding complete</p>
        <h1 className="mt-2 text-2xl font-bold">Your personalized 4HR plan is being prepared</h1>
        <p className="mt-3 text-fg-muted">
          Youssef is reviewing your information and building your plan. You&apos;ll get access here as soon as it&apos;s ready.
        </p>
        <div className="mt-6 card p-4">
          <p className="text-sm text-fg-muted">In the meantime, any questions?</p>
          <a href={whatsappLink("Hi Youssef, quick question while my 4HR plan is being prepared.")} target="_blank" rel="noopener noreferrer" className="btn btn-ghost text-sm mt-2 inline-flex">
            Message Youssef on WhatsApp
          </a>
        </div>
      </Shell>
    );
  }

  if (client.status === "PAUSED") {
    return (
      <Shell name={user.firstName}>
        <h1 className="text-2xl font-bold">Your coaching is paused</h1>
        <p className="mt-3 text-fg-muted">Reach out to Youssef whenever you&apos;re ready to resume.</p>
        <a href={whatsappLink("Hi Youssef, I'd like to resume my 4HR coaching.")} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm mt-4 inline-flex">
          Message Youssef on WhatsApp
        </a>
      </Shell>
    );
  }

  if (client.status === "COMPLETED") {
    const active = await getActiveProgram(client.id);
    const weeks = totalWeeks(client.startDate, client.endDate);
    return (
      <Shell name={user.firstName}>
        <section className="card p-6 sm:p-8">
          <p className="eyebrow">4HR Transformation</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Program complete</h1>
          <p className="mt-2 text-fg-muted">You&apos;ve completed your current training block.</p>

          {(active?.program?.name || weeks) && (
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
              {active?.program?.name && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-fg-muted">Program</dt>
                  <dd className="mt-0.5 font-medium">{active.program.name}</dd>
                </div>
              )}
              {weeks && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-fg-muted">Completed</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">{weeks} of {weeks} weeks</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-6 rounded-lg border border-line bg-surface/40 p-4">
            <p className="text-sm font-medium">Next block coming soon</p>
            <p className="mt-1 text-sm text-fg-muted">
              Youssef will review your progress and update your training before your next phase begins.
            </p>
          </div>
        </section>
      </Shell>
    );
  }

  // ACTIVE — the client's live portal is the Home dashboard.
  return <ClientHome client={client} firstName={user.firstName} />;
}

function Shell({ name, children }: { name: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-5 h-16 border-b border-line">
        <span className="eyebrow">4HR{name ? ` · ${name}` : ""}</span>
        <UserButton />
      </header>
      <main className="mx-auto max-w-lg px-5 py-10">{children}</main>
    </div>
  );
}
