import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getSessionUser, getMyClientRecord } from "@/lib/auth";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (user.role === "COACH") redirect("/coach");

  const client = await getMyClientRecord();
  if (!client) redirect("/");
  // Onboarding is only for clients who haven't submitted yet.
  if (client.status !== "INVITED" && client.status !== "ONBOARDING") redirect("/");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-5 h-16 border-b border-line">
        <span className="eyebrow">4HR · Onboarding</span>
        <UserButton />
      </header>
      <main className="mx-auto max-w-lg px-5 py-8">
        <p className="eyebrow">Welcome to 4HR{user.firstName ? `, ${user.firstName}` : ""}</p>
        <h1 className="mt-2 text-2xl font-bold">Let&apos;s build your plan</h1>
        <p className="mt-2 text-fg-muted text-sm">
          A few questions so Youssef can design your training and nutrition around your life. Takes ~5 minutes.
        </p>
        <div className="mt-6">
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
