"use client";
import { useActionState } from "react";
import { setNutritionPlan } from "@/lib/actions";

type Plan = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  mealGuidance: string;
  coachNotes: string;
  adherence: string;
} | null;

export function NutritionPlanForm({ clientId, plan }: { clientId: string; plan: Plan }) {
  const [state, action, pending] = useActionState(setNutritionPlan.bind(null, clientId), null as null | { ok: boolean; message: string });

  return (
    <form action={action} className="mt-3 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div><label className="label text-xs">Calories</label><input name="calories" inputMode="numeric" defaultValue={plan?.calories ?? ""} placeholder="kcal" className="input py-2" /></div>
        <div><label className="label text-xs">Protein (g)</label><input name="protein" inputMode="numeric" defaultValue={plan?.protein ?? ""} className="input py-2" /></div>
        <div><label className="label text-xs">Carbs (g)</label><input name="carbs" inputMode="numeric" defaultValue={plan?.carbs ?? ""} className="input py-2" /></div>
        <div><label className="label text-xs">Fat (g)</label><input name="fat" inputMode="numeric" defaultValue={plan?.fat ?? ""} className="input py-2" /></div>
      </div>
      <div>
        <label className="label text-xs">Meal guidance <span className="text-fg-muted font-normal">(daily structure + food examples)</span></label>
        <textarea name="mealGuidance" rows={4} defaultValue={plan?.mealGuidance ?? ""} className="input resize-y text-sm" placeholder="e.g. 3 meals + 1 snack. Protein with each meal. Examples: chicken, eggs, Greek yogurt, rice, oats, fruit…" />
      </div>
      <div>
        <label className="label text-xs">Adherence</label>
        <input name="adherence" defaultValue={plan?.adherence ?? ""} className="input py-2 text-sm" placeholder="e.g. Hit protein daily; stay within ~100 kcal of target 6 days/week." />
      </div>
      <div>
        <label className="label text-xs">Coach notes</label>
        <textarea name="coachNotes" rows={2} defaultValue={plan?.coachNotes ?? ""} className="input resize-y text-sm" placeholder="Anything personal for this client." />
      </div>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn btn-primary text-sm px-6">{pending ? "Saving…" : "Save nutrition plan"}</button>
        {state && <span className={`text-xs ${state.ok ? "text-emerald-500" : "text-red-500"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
