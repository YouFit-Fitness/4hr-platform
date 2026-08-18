import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getSessionUser, getMyClientRecord, isCoachEmailConfigured } from "@/lib/auth";

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
        <div className="mt-6 card p-4 text-sm text-fg-muted">
          In the meantime, quick questions? Reach Youssef on WhatsApp as usual.
        </div>
      </Shell>
    );
  }

  if (client.status === "PAUSED") {
    return (
      <Shell name={user.firstName}>
        <h1 className="text-2xl font-bold">Your coaching is paused</h1>
        <p className="mt-3 text-fg-muted">Reach out to Youssef whenever you&apos;re ready to resume.</p>
      </Shell>
    );
  }

  if (client.status === "COMPLETED") {
    return (
      <Shell name={user.firstName}>
        <h1 className="text-2xl font-bold">Your program is complete 🎉</h1>
        <p className="mt-3 text-fg-muted">Thank you for training with 4HR. Talk to Youssef about what&apos;s next.</p>
      </Shell>
    );
  }

  // ACTIVE — the client's live portal is the training screen.
  redirect("/train");
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
