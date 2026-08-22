"use client";
import { useState, useActionState, useEffect } from "react";
import { MoveExerciseButtons, RemoveProgramExerciseButton } from "@/components/TrainingButtons";
import { updateProgramExercise } from "@/lib/training";

export type PE = {
  id: string;
  exerciseName: string;
  targetSets: number | null;
  targetReps: string | null;
  targetRpe: string | null;
  tempo: string | null;
  restSeconds: number | null;
  notes: string;
};

export function ProgramExerciseRow({ pe, programId, isFirst, isLast }: { pe: PE; programId: string; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="border-b border-line/50 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <MoveExerciseButtons id={pe.id} programId={programId} isFirst={isFirst} isLast={isLast} />
          <div className="text-sm min-w-0">
            <span className="font-medium">{pe.exerciseName}</span>
            <span className="text-fg-muted">
              {" · "}
              {pe.targetSets ?? "?"}×{pe.targetReps ?? "?"}
              {pe.targetRpe ? ` @RPE ${pe.targetRpe}` : ""}
              {pe.tempo ? ` · tempo ${pe.tempo}` : ""}
              {pe.restSeconds ? ` · ${pe.restSeconds}s rest` : ""}
            </span>
            {pe.notes && <p className="text-xs text-fg-muted">{pe.notes}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-xs text-fg-muted hover:text-fg transition-colors">
            {editing ? "Close" : "Edit"}
          </button>
          <RemoveProgramExerciseButton id={pe.id} programId={programId} />
        </div>
      </div>
      {editing && <EditPrescriptionForm pe={pe} programId={programId} onDone={() => setEditing(false)} />}
    </li>
  );
}

function EditPrescriptionForm({ pe, programId, onDone }: { pe: PE; programId: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateProgramExercise.bind(null, pe.id, programId), null as null | { ok: boolean; message: string });
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="mt-3">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div><label className="label text-xs">Sets</label><input name="targetSets" inputMode="numeric" defaultValue={pe.targetSets ?? ""} className="input py-2" /></div>
        <div><label className="label text-xs">Reps</label><input name="targetReps" defaultValue={pe.targetReps ?? ""} placeholder="8–12" className="input py-2" /></div>
        <div><label className="label text-xs">RPE</label><input name="targetRpe" inputMode="decimal" defaultValue={pe.targetRpe ?? ""} className="input py-2" /></div>
        <div><label className="label text-xs">Tempo</label><input name="tempo" defaultValue={pe.tempo ?? ""} placeholder="3-1-1" className="input py-2" /></div>
        <div><label className="label text-xs">Rest (s)</label><input name="restSeconds" inputMode="numeric" defaultValue={pe.restSeconds ?? ""} className="input py-2" /></div>
      </div>
      <div className="mt-2">
        <label className="label text-xs">Note</label>
        <input name="notes" defaultValue={pe.notes} placeholder="Client-specific cue" className="input py-2 text-sm" />
      </div>
      <div className="mt-2 flex gap-2">
        <button disabled={pending} className="btn btn-primary text-sm px-5">{pending ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onDone} className="btn btn-ghost text-sm px-4">Cancel</button>
      </div>
    </form>
  );
}
