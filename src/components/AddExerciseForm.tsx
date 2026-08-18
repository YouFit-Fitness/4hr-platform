"use client";
import { useActionState, useEffect, useRef } from "react";
import { createExercise } from "@/lib/training";

export function AddExerciseForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createExercise, null as null | { ok: boolean; message: string });
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="card p-4 space-y-3">
      <p className="font-semibold">Add exercise</p>
      <div>
        <label className="label">Name</label>
        <input name="name" required placeholder="Barbell Back Squat" className="input" />
      </div>
      <div>
        <label className="label">Muscle group <span className="text-fg-muted font-normal">(optional)</span></label>
        <input name="muscleGroup" placeholder="Legs" className="input" />
      </div>
      <div>
        <label className="label">Demo video URL <span className="text-fg-muted font-normal">(optional)</span></label>
        <input name="videoUrl" type="url" placeholder="https://youtu.be/…" className="input" />
      </div>
      <div>
        <label className="label">Coaching cues <span className="text-fg-muted font-normal">(optional)</span></label>
        <textarea name="cues" rows={2} placeholder="Brace, control the eccentric…" className="input resize-y" />
      </div>
      {state && <p className={`text-xs ${state.ok ? "text-brand" : "text-red-500"}`}>{state.message}</p>}
      <button disabled={pending} className="btn btn-primary w-full">{pending ? "…" : "Add to library"}</button>
    </form>
  );
}
