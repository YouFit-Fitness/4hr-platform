import "server-only";
import { and, eq } from "drizzle-orm";
import { db, nutritionPlans } from "@/db";
import type { NutritionPlan } from "@/db";

/** The client's active nutrition plan, or null if the coach hasn't set one. */
export async function getActiveNutritionPlan(clientId: string): Promise<NutritionPlan | null> {
  const [plan] = await db
    .select()
    .from(nutritionPlans)
    .where(and(eq(nutritionPlans.clientId, clientId), eq(nutritionPlans.active, true)))
    .limit(1);
  return plan ?? null;
}

/** Does the client have any macro/calorie targets or guidance set? */
export function hasNutritionContent(p: NutritionPlan | null): boolean {
  if (!p) return false;
  return !!(p.calories || p.protein || p.carbs || p.fat || p.mealGuidance.trim() || p.coachNotes.trim());
}
