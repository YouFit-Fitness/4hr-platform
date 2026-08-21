"use client";
import { useMemo, useState } from "react";
import { DeleteExerciseButton, ArchiveExerciseButton } from "@/components/TrainingButtons";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  videoUrl: string | null;
  cues: string | null;
  archived: boolean;
};

export function ExerciseBrowser({ exercises }: { exercises: Exercise[] }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const muscles = useMemo(() => uniq(exercises.map((e) => e.muscleGroup)), [exercises]);
  const equipments = useMemo(() => uniq(exercises.map((e) => e.equipment)), [exercises]);

  const active = exercises.filter((e) => !e.archived);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        (showArchived ? e.archived : !e.archived) &&
        (!muscle || e.muscleGroup === muscle) &&
        (!equipment || e.equipment === equipment) &&
        (!needle || e.name.toLowerCase().includes(needle)),
    );
  }, [exercises, q, muscle, equipment, showArchived]);

  return (
    <section>
      <h1 className="text-2xl font-bold">Exercise library</h1>
      <p className="text-sm text-fg-muted mt-1">{active.length} exercises · reusable across programs</p>

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises…" className="input flex-1" aria-label="Search exercises by name" />
        <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="input sm:w-40" aria-label="Filter by muscle group">
          <option value="">All muscles</option>
          {muscles.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={equipment} onChange={(e) => setEquipment(e.target.value)} className="input sm:w-40" aria-label="Filter by equipment">
          <option value="">All equipment</option>
          {equipments.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-fg-muted">{filtered.length} shown</p>
        <label className="flex items-center gap-1.5 text-xs text-fg-muted cursor-pointer">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      <div className="mt-2 space-y-2">
        {filtered.map((e) => (
          <div key={e.id} className="card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{e.name}</p>
              <p className="text-xs text-fg-muted mt-0.5">
                {[e.muscleGroup, e.equipment].filter(Boolean).join(" · ") || "—"}
                {e.videoUrl && (
                  <>
                    {" · "}
                    <a href={e.videoUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">demo video</a>
                  </>
                )}
              </p>
              {e.cues && <p className="text-xs text-fg-muted mt-1 whitespace-pre-line">{e.cues}</p>}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <ArchiveExerciseButton id={e.id} archived={e.archived} />
              <DeleteExerciseButton id={e.id} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-fg-muted text-sm py-4">No exercises match your search.</p>}
      </div>
    </section>
  );
}

function uniq(vals: (string | null)[]): string[] {
  return Array.from(new Set(vals.filter(Boolean) as string[])).sort();
}
