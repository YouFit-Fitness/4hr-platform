import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users, clients, type User, type Client } from "@/db";

/**
 * SERVER-SIDE authorization. Never trust the client, hidden UI, or URL hiding.
 * The coach is identified by COACH_EMAIL; everyone else is a CLIENT.
 */
const COACH_EMAIL = (process.env.COACH_EMAIL ?? "").trim().toLowerCase();

/**
 * Ensure the signed-in Clerk user has a Neon `users` row (just-in-time sync on
 * first sign-in — no webhook needed for Phase 1). Returns the row.
 */
export async function getSessionUser(): Promise<User> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const found = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);
  if (found[0]) return found[0];

  // First sign-in: create the identity row (race-safe via unique clerk_user_id).
  const cu = await currentUser();
  const email = (cu?.primaryEmailAddress?.emailAddress ?? "").toLowerCase();
  const role: "COACH" | "CLIENT" = email && email === COACH_EMAIL ? "COACH" : "CLIENT";

  await db
    .insert(users)
    .values({ clerkUserId: userId, email, firstName: cu?.firstName ?? null, lastName: cu?.lastName ?? null, role })
    .onConflictDoNothing({ target: users.clerkUserId });

  const [row] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);

  // Link a CLIENT to the client record their coach pre-created at invite time.
  if (row.role === "CLIENT" && email) {
    const [c] = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
    if (c && !c.userId) {
      await db
        .update(clients)
        .set({
          userId: row.id,
          status: c.status === "INVITED" ? "ONBOARDING" : c.status,
          activatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(clients.id, c.id));
    }
  }
  return row;
}

/** Require the COACH role. Clients are bounced to their own area. */
export async function requireCoach(): Promise<User> {
  const u = await getSessionUser();
  if (u.role !== "COACH") redirect("/");
  return u;
}

/** The current client's OWN client record (or null). Never another client's. */
export async function getMyClientRecord(): Promise<Client | null> {
  const u = await getSessionUser();
  if (u.role !== "CLIENT") return null;
  const [c] = await db.select().from(clients).where(eq(clients.userId, u.id)).limit(1);
  return c ?? null;
}

export function isCoachEmailConfigured(): boolean {
  return COACH_EMAIL.length > 0;
}
