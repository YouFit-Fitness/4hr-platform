"use server";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, clients, onboardingResponses } from "@/db";
import { requireCoach, getMyClientRecord } from "@/lib/auth";
import { onboardingFieldKeys, onboardingRequiredKeys } from "@/lib/onboarding";

const CLIENT_STATUSES = ["INVITED", "ONBOARDING", "PLAN_SETUP", "ACTIVE", "PAUSED", "COMPLETED"] as const;

async function appOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const newShortCode = () => randomBytes(6).toString("base64url"); // ~8 url-safe chars
async function shortLink(code: string): Promise<string> {
  return `${await appOrigin()}/i/${code}`;
}

/** COACH: invite a client — creates a Clerk invitation + a client record (INVITED). */
export async function inviteClient(_prev: unknown, formData: FormData): Promise<{ ok: boolean; message: string; inviteUrl?: string }> {
  await requireCoach();
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { ok: false, message: "Enter a valid email address." };

  const existing = await db.select().from(clients).where(eq(clients.email, email.data)).limit(1);
  if (existing[0]) return { ok: false, message: "A client with that email already exists." };

  let inviteUrl: string | undefined;
  try {
    const cc = await clerkClient();
    const inv = await cc.invitations.createInvitation({
      emailAddress: email.data,
      redirectUrl: `${await appOrigin()}/sign-up`,
      ignoreExisting: true,
    });
    inviteUrl = inv.url ?? undefined;
  } catch (err) {
    console.error("[invite] clerk invitation failed:", err instanceof Error ? err.message : err);
    return { ok: false, message: "Could not send the invitation. Please try again." };
  }

  const code = newShortCode();
  await db.insert(clients).values({ email: email.data, status: "INVITED", inviteUrl: inviteUrl ?? null, inviteCode: code });
  revalidatePath("/coach");
  return { ok: true, message: `Invitation sent to ${email.data}.`, inviteUrl: await shortLink(code) };
}

/** COACH: get a short, branded sign-up link for an invited client (creates one if missing). */
export async function getInviteLink(clientId: string): Promise<{ ok: boolean; url?: string; message?: string }> {
  await requireCoach();
  const [c] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!c) return { ok: false, message: "Client not found." };

  let rawUrl = c.inviteUrl;
  let code = c.inviteCode;
  try {
    if (!rawUrl) {
      const cc = await clerkClient();
      const inv = await cc.invitations.createInvitation({
        emailAddress: c.email,
        redirectUrl: `${await appOrigin()}/sign-up`,
        ignoreExisting: true,
      });
      rawUrl = inv.url ?? null;
    }
    if (!code) code = newShortCode();
    if (rawUrl !== c.inviteUrl || code !== c.inviteCode) {
      await db.update(clients).set({ inviteUrl: rawUrl, inviteCode: code }).where(eq(clients.id, clientId));
      revalidatePath(`/coach/clients/${clientId}`);
    }
    if (!rawUrl) return { ok: false, message: "Could not generate a link. Please try again." };
    return { ok: true, url: await shortLink(code) };
  } catch (err) {
    console.error("[getInviteLink] clerk invitation failed:", err instanceof Error ? err.message : err);
    return { ok: false, message: "Could not generate a link. Please try again." };
  }
}

/** CLIENT: submit the onboarding questionnaire (own record only) → PLAN_SETUP. */
export async function submitOnboarding(_prev: unknown, formData: FormData): Promise<{ ok: boolean; message: string }> {
  const client = await getMyClientRecord();
  if (!client) return { ok: false, message: "No coaching record found. Please contact your coach." };
  if (client.status !== "ONBOARDING" && client.status !== "INVITED") {
    return { ok: false, message: "Onboarding has already been submitted." };
  }

  const data: Record<string, string> = {};
  for (const key of onboardingFieldKeys) {
    const v = formData.get(key);
    if (typeof v === "string" && v.trim()) data[key] = v.trim().slice(0, 2000);
  }
  const missing = onboardingRequiredKeys.filter((k) => !data[k]);
  if (missing.length) return { ok: false, message: "Please complete all required fields." };

  await db.insert(onboardingResponses).values({ clientId: client.id, data });
  await db
    .update(clients)
    .set({ status: "PLAN_SETUP", onboardedAt: new Date(), updatedAt: new Date() })
    .where(eq(clients.id, client.id));
  revalidatePath("/");
  return { ok: true, message: "Onboarding submitted." };
}

/** COACH: private notes on a client. */
export async function updateCoachNotes(clientId: string, notes: string): Promise<void> {
  await requireCoach();
  await db
    .update(clients)
    .set({ coachNotes: notes.slice(0, 5000), updatedAt: new Date() })
    .where(eq(clients.id, clientId));
  revalidatePath(`/coach/clients/${clientId}`);
}

/** COACH: change a client's lifecycle status (+ set start date on activation). */
export async function setClientStatus(clientId: string, status: string): Promise<void> {
  await requireCoach();
  if (!CLIENT_STATUSES.includes(status as (typeof CLIENT_STATUSES)[number])) return;
  const [c] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!c) return;
  const patch: Partial<typeof clients.$inferInsert> = { status: status as (typeof CLIENT_STATUSES)[number], updatedAt: new Date() };
  if (status === "ACTIVE" && !c.startDate) patch.startDate = new Date().toISOString().slice(0, 10);
  await db.update(clients).set(patch).where(eq(clients.id, clientId));
  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach");
}

/** COACH: set configurable coaching start/end dates (NOT hardcoded to 12 weeks). */
export async function setClientDates(clientId: string, startDate: string, endDate: string): Promise<void> {
  await requireCoach();
  await db
    .update(clients)
    .set({ startDate: startDate || null, endDate: endDate || null, updatedAt: new Date() })
    .where(eq(clients.id, clientId));
  revalidatePath(`/coach/clients/${clientId}`);
}
