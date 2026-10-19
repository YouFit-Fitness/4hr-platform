import { redirect } from "next/navigation";
import { getSessionUser, getMyClientRecord } from "@/lib/auth";
import { getActiveProgram } from "@/lib/client-training";
import { ClientShell } from "@/components/ClientShell";

const STATUS_LABEL: Record<string, string> = {
  INVITED: "Invited", ONBOARDING: "Onboarding", PLAN_SETUP: "Plan being prepared",
  ACTIVE: "Active", PAUSED: "Paused", COMPLETED: "Completed",
};

function weekLine(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const s = new Date(start.slice(0, 10) + "T00:00:00").getTime();
  const e = new Date(end.slice(0, 10) + "T00:00:00").getTime();
  const total = Math.max(1, Math.round((e - s) / (7 * 864e5)));
  const cur = Math.min(total, Math.max(1, Math.floor((Date.now() - s) / (7 * 864e5)) + 1));
  return `Week ${cur} of ${total}`;
}

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (user.role === "COACH") redirect("/coach");
  const client = await getMyClientRecord();
  if (!client) redirect("/");

  const active = await getActiveProgram(client.id);
  const week = weekLine(client.startDate, client.endDate);
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <ClientShell active="profile" name={user.firstName}>
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <section className="mt-5 card p-5">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-2 text-sm font-medium">{fullName || "—"}</p>
        <p className="text-sm text-fg-muted break-all">{client.email}</p>
        <p className="mt-3 text-xs text-fg-muted">Use the avatar at the top-right to manage your account or sign out.</p>
      </section>

      <section className="mt-4 card p-5">
        <h2 className="font-semibold">Your coaching</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Row label="Status" value={STATUS_LABEL[client.status] ?? client.status} />
          {active?.program?.name && <Row label="Program" value={active.program.name} />}
          {week && <Row label="Progress" value={week} />}
          {client.startDate && <Row label="Start" value={client.startDate} />}
          {client.endDate && <Row label="End" value={client.endDate} />}
        </dl>
      </section>

      <section className="mt-4 card p-5">
        <h2 className="font-semibold">Need help?</h2>
        <p className="mt-1 text-sm text-fg-muted">Questions about your plan? Reach Youssef on WhatsApp, as usual.</p>
      </section>
    </ClientShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-fg-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
