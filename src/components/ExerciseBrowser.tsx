"use client";
import { useMemo, useState } from "react";
import { DeleteExerciseButton, ArchiveExerciseButton } from "@/components/TrainingButtons";
import { EditExerciseForm } from "@/components/EditExerciseForm";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  movementCategory: string | null;
  videoUrl: string | null;
  cues: string | null;
  archived: boolean;
};

export function ExerciseBrowser({ exercises }: { exercises: Exercise[] }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

      <div className="mt-5 space-y-2">
        <div className="relative">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search exercises…"
            className="input w-full"
            style={{ paddingLeft: "2.85rem", paddingTop: "0.8rem", paddingBottom: "0.8rem" }}
            aria-label="Search exercises by name"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:max-w-md">
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="input" aria-label="Filter by muscle group">
            <option value="">All muscles</option>
            {muscles.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={equipment} onChange={(e) => setEquipment(e.target.value)} className="input" aria-label="Filter by equipment">
            <option value="">All equipment</option>
            {equipments.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
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
          <div key={e.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
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
                <button
                  type="button"
                  onClick={() => setEditingId((cur) => (cur === e.id ? null : e.id))}
                  className="text-xs text-fg-muted hover:text-fg transition-colors"
                >
                  {editingId === e.id ? "Close" : "Edit"}
                </button>
                <ArchiveExerciseButton id={e.id} archived={e.archived} />
                <DeleteExerciseButton id={e.id} />
              </div>
            </div>
            {editingId === e.id && <EditExerciseForm exercise={e} onDone={() => setEditingId(null)} />}
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
