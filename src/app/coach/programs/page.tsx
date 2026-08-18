import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, programs } from "@/db";
import { requireCoach } from "@/lib/auth";
import { CoachHeader } from "@/components/CoachHeader";
import { CreateProgramForm } from "@/components/CreateProgramForm";

export default async function ProgramsPage() {
  await requireCoach();
  const list = await db.select().from(programs).orderBy(desc(programs.createdAt));

  return (
    <div className="min-h-dvh">
      <CoachHeader active="programs" />
      <main className="mx-auto max-w-4xl px-6 py-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <h1 className="text-2xl font-bold">Programs</h1>
          <p className="text-sm text-fg-muted mt-1">{list.length} programs · weekly-repeating training templates</p>
          <div className="mt-5 space-y-2">
            {list.map((p) => (
              <Link key={p.id} href={`/coach/programs/${p.id}`} className="card p-4 block hover:border-fg-muted transition-colors">
                <p className="font-medium">{p.name}</p>
                {p.description && <p className="text-xs text-fg-muted mt-0.5">{p.description}</p>}
              </Link>
            ))}
            {list.length === 0 && <p className="text-fg-muted text-sm">No programs yet — create your first one.</p>}
          </div>
        </section>
        <aside>
          <div className="sticky top-6">
            <CreateProgramForm />
          </div>
        </aside>
      </main>
    </div>
  );
}
