import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db, clients, onboardingResponses } from "@/db";
import { requireCoach } from "@/lib/auth";
import { updateCoachNotes, setClientStatus, setClientDates } from "@/lib/actions";
import { onboardingSections } from "@/lib/onboarding";

const LABELS: Record<string, string> = Object.fromEntries(
  onboardingSections.flatMap((s) => s.fields.map((f) => [f.key, f.label])),
);

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;

  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) notFound();

  const [onboarding] = await db
    .select()
    .from(onboardingResponses)
    .where(eq(onboardingResponses.clientId, id))
    .orderBy(desc(onboardingResponses.submittedAt))
    .limit(1);
  const answers = (onboarding?.data ?? null) as Record<string, string> | null;

  // Inline form adapters (delegate to authorization-guarded lib actions).
  async function saveNotes(formData: FormData) {
    "use server";
    await updateCoachNotes(id, String(formData.get("notes") ?? ""));
  }
  async function changeStatus(formData: FormData) {
    "use server";
    await setClientStatus(id, String(formData.get("status") ?? ""));
  }
  async function saveDates(formData: FormData) {
    "use server";
    await setClientDates(id, String(formData.get("startDate") ?? ""), String(formData.get("endDate") ?? ""));
  }

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-6 h-16 border-b border-line">
        <Link href="/coach" className="text-sm text-fg-muted hover:text-fg">← All clients</Link>
        <span className="eyebrow">4HR · Coach</span>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold break-all">{client.email}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Status: <span className="text-fg font-medium">{client.status}</span>
            {client.startDate && <> · Start {client.startDate}</>}
            {client.endDate && <> · End {client.endDate}</>}
          </p>
        </div>

        {/* Lifecycle actions */}
        <section className="card p-5">
          <h2 className="font-semibold">Lifecycle</h2>
          <form action={changeStatus} className="mt-3 flex flex-wrap gap-2">
            {["ONBOARDING", "PLAN_SETUP", "ACTIVE", "PAUSED", "COMPLETED"].map((s) => (
              <button
                key={s}
                name="status"
                value={s}
                disabled={client.status === s}
                className={`btn text-sm ${client.status === s ? "btn-ghost opacity-40" : "btn-ghost"}`}
              >
                {s === "ACTIVE" ? "Activate" : s.replace("_", " ").toLowerCase()}
              </button>
            ))}
          </form>
          <p className="mt-2 text-xs text-fg-muted">
            Activating a client sets their start date (if unset) and unlocks their portal.
          </p>
        </section>

        {/* Configurable coaching dates */}
        <section className="card p-5">
          <h2 className="font-semibold">Coaching period</h2>
          <form action={saveDates} className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Start date</label>
              <input type="date" name="startDate" defaultValue={client.startDate ?? ""} className="input" />
            </div>
            <div>
              <label className="label">End date</label>
              <input type="date" name="endDate" defaultValue={client.endDate ?? ""} className="input" />
            </div>
            <button className="btn btn-ghost text-sm">Save dates</button>
          </form>
        </section>

        {/* Onboarding review */}
        <section className="card p-5">
          <h2 className="font-semibold">Onboarding</h2>
          {answers ? (
            <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {Object.entries(answers).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wide text-fg-muted">{LABELS[k] ?? k}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-fg-muted">Not submitted yet.</p>
          )}
        </section>

        {/* Private coach notes */}
        <section className="card p-5">
          <h2 className="font-semibold">Private coach notes</h2>
          <form action={saveNotes} className="mt-3">
            <textarea name="notes" defaultValue={client.coachNotes} rows={5} className="input resize-y" placeholder="Only you can see this." />
            <button className="btn btn-primary text-sm mt-3">Save notes</button>
          </form>
        </section>
      </main>
    </div>
  );
}
