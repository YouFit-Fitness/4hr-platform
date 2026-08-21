"use client";
import { useMemo, useRef, useState, useEffect, useActionState } from "react";
import { addExerciseToProgramDay } from "@/lib/training";

type Exercise = { id: string; name: string; muscleGroup: string | null };

export function AddExerciseToDay({ programId, dayId, library }: { programId: string; dayId: string; library: Exercise[] }) {
  const [state, action, pending] = useActionState(addExerciseToProgramDay.bind(null, programId), null as null | { ok: boolean; message: string });
  const formRef = useRef<HTMLFormElement>(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const muscles = useMemo(
    () => Array.from(new Set(library.map((e) => e.muscleGroup).filter(Boolean) as string[])).sort(),
    [library],
  );
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return library
      .filter((e) => (!muscle || e.muscleGroup === muscle) && (!needle || e.name.toLowerCase().includes(needle)))
      .slice(0, 60);
  }, [library, q, muscle]);

  // Reset after a successful add.
  useEffect(() => {
    if (state?.ok) {
      setSelected(null);
      setQ("");
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-4 border-t border-line/70 pt-4">
      <input type="hidden" name="dayId" value={dayId} />
      <input type="hidden" name="exerciseId" value={selected?.id ?? ""} />

      {/* Exercise picker */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-left text-sm"
          aria-expanded={open}
        >
          <span className={selected ? "font-medium" : "text-fg-muted"}>
            {selected ? selected.name : "Choose an exercise…"}
          </span>
          <span className="text-fg-muted text-xs">{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div className="mt-2 rounded-lg border border-line bg-surface-2 p-2">
            <div className="flex gap-2">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="input flex-1 py-2 text-sm" aria-label="Search exercises" />
              <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="input w-36 py-2 text-sm" aria-label="Filter by muscle group">
                <option value="">All</option>
                {muscles.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <ul className="mt-2 max-h-56 overflow-y-auto">
              {filtered.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => { setSelected(e); setOpen(false); }}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-surface"
                  >
                    <span>{e.name}</span>
                    <span className="text-xs text-fg-muted">{e.muscleGroup}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="px-2 py-3 text-sm text-fg-muted">No matches.</li>}
            </ul>
          </div>
        )}
      </div>

      {/* Prescription (client-specific) */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div><label className="label text-xs">Sets</label><input name="targetSets" inputMode="numeric" className="input py-2" /></div>
        <div><label className="label text-xs">Reps</label><input name="targetReps" placeholder="8–12" className="input py-2" /></div>
        <div><label className="label text-xs">RPE</label><input name="targetRpe" inputMode="decimal" className="input py-2" /></div>
        <div><label className="label text-xs">Rest (s)</label><input name="restSeconds" inputMode="numeric" className="input py-2" /></div>
      </div>
      <div className="mt-2">
        <label className="label text-xs">Note <span className="text-fg-muted font-normal">(optional)</span></label>
        <input name="notes" placeholder="Client-specific cue for this program" className="input py-2 text-sm" />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button disabled={pending || !selected} className="btn btn-primary text-sm px-6">{pending ? "Adding…" : "Add to day"}</button>
        {state && !state.ok && <span className="text-xs text-red-500">{state.message}</span>}
      </div>
    </form>
  );
}
