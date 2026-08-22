import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, clients } from "@/db";

/** Public short link: /i/<code> → the client's full Clerk invitation URL. */
export default async function InviteRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [c] = await db.select({ url: clients.inviteUrl }).from(clients).where(eq(clients.inviteCode, code)).limit(1);
  if (!c || !c.url) notFound();
  redirect(c.url);
}
