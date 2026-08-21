"use client";
import { useMemo, useState } from "react";
import { DeleteExerciseButton } from "@/components/TrainingButtons";

type Exercise = { id: string; name: string; muscleGroup: string | null; videoUrl: string | null; cues: string | null };

export function ExerciseBrowser({ exercises }: { exercises: Exercise[] }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");

  const muscles = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.muscleGroup).filter(Boolean) as string[])).sort(),
    [exercises],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises.filter(
      (e) => (!muscle || e.muscleGroup === muscle) && (!needle || e.name.toLowerCase().includes(needle)),
    );
  }, [exercises, q, muscle]);

  return (
    <section>
      <h1 className="text-2xl font-bold">Exercise library</h1>
      <p className="text-sm text-fg-muted mt-1">{exercises.length} exercises · reusable across programs</p>

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises…"
          className="input flex-1"
          aria-label="Search exercises by name"
        />
        <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="input sm:w-52" aria-label="Filter by muscle group">
          <option value="">All muscle groups</option>
          {muscles.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-xs text-fg-muted">{filtered.length} shown</p>

      <div className="mt-2 space-y-2">
        {filtered.map((e) => (
          <div key={e.id} className="card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{e.name}</p>
              <p className="text-xs text-fg-muted mt-0.5">
                {e.muscleGroup || "—"}
                {e.videoUrl && (
                  <>
                    {" · "}
                    <a href={e.videoUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">demo video</a>
                  </>
                )}
              </p>
              {e.cues && <p className="text-xs text-fg-muted mt-1 whitespace-pre-line">{e.cues}</p>}
            </div>
            <DeleteExerciseButton id={e.id} />
          </div>
        ))}
        {filtered.length === 0 && <p className="text-fg-muted text-sm py-4">No exercises match your search.</p>}
      </div>
    </section>
  );
}
