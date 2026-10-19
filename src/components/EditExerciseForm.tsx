"use client";
import { useActionState, useEffect } from "react";
import { updateExercise } from "@/lib/training";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  movementCategory?: string | null;
  videoUrl: string | null;
  imageUrl?: string | null;
  cues: string | null;
};

export function EditExerciseForm({ exercise, onDone }: { exercise: Exercise; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateExercise.bind(null, exercise.id), null as null | { ok: boolean; message: string });
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="mt-3 space-y-2 border-t border-line/70 pt-3">
      <input name="name" required defaultValue={exercise.name} placeholder="Name" className="input py-2" />
      <div className="grid grid-cols-2 gap-2">
        <input name="muscleGroup" defaultValue={exercise.muscleGroup ?? ""} placeholder="Muscle group" className="input py-2" />
        <input name="equipment" defaultValue={exercise.equipment ?? ""} placeholder="Equipment" className="input py-2" />
      </div>
      <input name="movementCategory" defaultValue={exercise.movementCategory ?? ""} placeholder="Movement category" className="input py-2" />
      <input name="videoUrl" type="url" defaultValue={exercise.videoUrl ?? ""} placeholder="Demo video URL" className="input py-2" />
      <input name="imageUrl" type="url" defaultValue={exercise.imageUrl ?? ""} placeholder="Image URL (used if no video)" className="input py-2" />
      <textarea name="cues" rows={2} defaultValue={exercise.cues ?? ""} placeholder="Coaching cues" className="input resize-y py-2 text-sm" />
      {state && !state.ok && <p className="text-xs text-red-500">{state.message}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="btn btn-primary text-sm px-5">{pending ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onDone} className="btn btn-ghost text-sm px-4">Cancel</button>
      </div>
    </form>
  );
}
