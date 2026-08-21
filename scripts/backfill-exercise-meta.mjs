/**
 * Backfills equipment + movement_category for seeded exercises (by name),
 * only where the field is currently NULL (never overwrites coach edits).
 * Safe, idempotent. Run: node scripts/backfill-exercise-meta.mjs
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { LIB } from "./seed-exercises.mjs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim().replace(/^"|"$/g, "");
const sql = neon(url);

let updated = 0;
for (const [name, , equipment, category] of LIB) {
  const r = await sql`
    update exercises
       set equipment = coalesce(equipment, ${equipment}),
           movement_category = coalesce(movement_category, ${category})
     where lower(name) = lower(${name})
       and (equipment is null or movement_category is null)
     returning id`;
  updated += r.length;
}
console.log(`Backfill complete. Updated ${updated} exercises with equipment + movement category.`);
