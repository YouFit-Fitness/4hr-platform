import { redirect } from "next/navigation";
import { getMyClientRecord } from "@/lib/auth";
import { getActiveNutritionPlan, hasNutritionContent } from "@/lib/nutrition";
import { ClientShell } from "@/components/ClientShell";

export default async function NutritionPage() {
  const client = await getMyClientRecord();
  if (!client) redirect("/");
  if (client.status !== "ACTIVE") redirect("/");

  const plan = await getActiveNutritionPlan(client.id);

  return (
    <ClientShell active="nutrition">
      <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>

      {!hasNutritionContent(plan) ? (
        <div className="mt-6 card p-8 text-center">
          <p className="font-medium">Your nutrition plan is being prepared</p>
          <p className="mt-1 text-sm text-fg-muted">Youssef will add your targets and guidance here shortly.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {(plan!.calories || plan!.protein || plan!.carbs || plan!.fat) && (
            <section>
              <h2 className="eyebrow mb-2">Daily targets</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label="Calories" value={plan!.calories} unit="kcal" accent />
                <Stat label="Protein" value={plan!.protein} unit="g" />
                <Stat label="Carbs" value={plan!.carbs} unit="g" />
                <Stat label="Fat" value={plan!.fat} unit="g" />
              </div>
            </section>
          )}

          {plan!.mealGuidance.trim() && (
            <section className="card p-5">
              <h2 className="font-semibold">Meal guidance</h2>
              <p className="mt-2 text-sm whitespace-pre-line">{plan!.mealGuidance}</p>
            </section>
          )}

          {plan!.adherence.trim() && (
            <section className="card p-5">
              <h2 className="font-semibold">How to follow it</h2>
              <p className="mt-2 text-sm whitespace-pre-line text-fg-muted">{plan!.adherence}</p>
            </section>
          )}

          {plan!.coachNotes.trim() && (
            <section className="rounded-lg border border-brand/30 bg-brand-soft/40 p-4">
              <p className="eyebrow mb-1">From your coach</p>
              <p className="text-sm whitespace-pre-line">{plan!.coachNotes}</p>
            </section>
          )}
        </div>
      )}
    </ClientShell>
  );
}

function Stat({ label, value, unit, accent }: { label: string; value: number | null; unit: string; accent?: boolean }) {
  return (
    <div className={`card p-3 text-center ${accent ? "border-brand/40" : ""}`}>
      <p className="text-2xl font-bold tabular-nums">{value ?? "—"}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-fg-muted">{label}{value != null ? ` · ${unit}` : ""}</p>
    </div>
  );
}
