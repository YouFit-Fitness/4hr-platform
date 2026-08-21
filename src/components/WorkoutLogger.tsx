"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { logWorkout } from "@/lib/client-actions";

type Item = {
  id: string;
  exerciseId: string;
  name: string;
  videoUrl: string | null;
  targetSets: number | null;
  targetReps: string | null;
  targetRpe: string | null;
  restSeconds: number | null;
  notes: string;
};
type SetEntry = { weight: string; reps: string; rpe: string };

const blankSet = (): SetEntry => ({ weight: "", reps: "", rpe: "" });

export function WorkoutLogger({ dayId, dayTitle, items }: { dayId: string; dayTitle: string; items: Item[] }) {
  const router = useRouter();
  const action = logWorkout.bind(null, dayId);
  const [state, formAction, pending] = useActionState(action, null as null | { ok: boolean; message: string });

  // One list of set-rows per exercise, seeded with the prescribed number of sets.
  const [sets, setSets] = useState<Record<string, SetEntry[]>>(() =>
    Object.fromEntries(
      items.map((it) => [it.id, Array.from({ length: Math.max(1, it.targetSets ?? 3) }, blankSet)]),
    ),
  );

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => router.push("/train"), 700);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const payload = useMemo(
    () =>
      JSON.stringify(
        items.map((it) => ({
          exerciseId: it.exerciseId,
          exerciseName: it.name,
          sets: (sets[it.id] ?? []).map((s) => ({
            weight: s.weight,
            reps: s.reps === "" ? undefined : Number(s.reps),
            rpe: s.rpe,
          })),
        })),
      ),
    [items, sets],
  );

  // A set "counts" once any of its fields is filled. Guards against empty logs.
  const filledSets = useMemo(
    () =>
      Object.values(sets)
        .flat()
        .filter((s) => s.weight.trim() !== "" || s.reps.trim() !== "" || s.rpe.trim() !== "").length,
    [sets],
  );

  function update(itemId: string, idx: number, field: keyof SetEntry, value: string) {
    setSets((prev) => {
      const next = { ...prev };
      const arr = [...(next[itemId] ?? [])];
      arr[idx] = { ...arr[idx], [field]: value };
      next[itemId] = arr;
      return next;
    });
  }
  function addSet(itemId: string) {
    setSets((prev) => ({ ...prev, [itemId]: [...(prev[itemId] ?? []), blankSet()] }));
  }
  function removeSet(itemId: string) {
    setSets((prev) => {
      const arr = prev[itemId] ?? [];
      if (arr.length <= 1) return prev;
      return { ...prev, [itemId]: arr.slice(0, -1) };
    });
  }

  return (
    <form action={formAction} className="space-y-5 pb-28">
      <input type="hidden" name="payload" value={payload} />

      {items.map((it) => (
        <section key={it.id} className="card p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">{it.name}</h2>
            <span className="text-xs text-fg-muted whitespace-nowrap">
              target {it.targetSets ?? "?"}×{it.targetReps ?? "?"}
              {it.targetRpe ? ` @${it.targetRpe}` : ""}
            </span>
          </div>
          {it.notes && <p className="mt-1 text-xs text-fg-muted">{it.notes}</p>}
          {it.videoUrl && (
            <a href={it.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-brand underline">
              Watch demo ↗
            </a>
          )}

          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr] gap-2 text-[11px] uppercase tracking-wide text-fg-muted">
              <span>#</span><span>Weight</span><span>Reps</span><span>RPE</span>
            </div>
            {(sets[it.id] ?? []).map((s, idx) => (
              <div key={idx} className="grid grid-cols-[1.5rem_1fr_1fr_1fr] gap-2 items-center">
                <span className="text-sm text-fg-muted tabular-nums">{idx + 1}</span>
                <input inputMode="decimal" value={s.weight} onChange={(e) => update(it.id, idx, "weight", e.target.value)} placeholder={it.restSeconds ? "kg" : "kg"} className="input py-2 text-center" />
                <input inputMode="numeric" value={s.reps} onChange={(e) => update(it.id, idx, "reps", e.target.value)} placeholder={it.targetReps ?? ""} className="input py-2 text-center" />
                <input inputMode="decimal" value={s.rpe} onChange={(e) => update(it.id, idx, "rpe", e.target.value)} placeholder={it.targetRpe ?? ""} className="input py-2 text-center" />
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => addSet(it.id)} className="btn btn-ghost text-xs">+ Set</button>
            {(sets[it.id]?.length ?? 0) > 1 && (
              <button type="button" onClick={() => removeSet(it.id)} className="btn btn-ghost text-xs">− Set</button>
            )}
          </div>
        </section>
      ))}

      <section className="card p-4">
        <label className="label">Session notes <span className="text-fg-muted font-normal">(optional)</span></label>
        <textarea name="notes" rows={3} className="input resize-y" placeholder="How did it feel? Any pain, PRs, substitutions…" />
      </section>

      {/* Sticky submit bar (thumb-reachable on mobile) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          {state && !state.ok ? (
            <span className="text-sm text-red-500">{state.message}</span>
          ) : state?.ok ? (
            <span className="text-sm text-emerald-500">{state.message}</span>
          ) : filledSets === 0 ? (
            <span className="text-sm text-fg-muted">Enter at least one set</span>
          ) : (
            <span className="text-sm text-fg-muted tabular-nums">{filledSets} set{filledSets === 1 ? "" : "s"}</span>
          )}
          <button disabled={pending || state?.ok || filledSets === 0} className="btn btn-primary flex-1">
            {pending ? "Saving…" : state?.ok ? "Logged ✓" : `Complete ${dayTitle}`}
          </button>
        </div>
      </div>
    </form>
  );
}
