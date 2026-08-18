"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProgram } from "@/lib/training";

export function CreateProgramForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createProgram, null as null | { ok: boolean; message: string; id?: string });
  useEffect(() => {
    if (state?.ok && state.id) router.push(`/coach/programs/${state.id}`);
  }, [state, router]);

  return (
    <form action={action} className="card p-4 space-y-3">
      <p className="font-semibold">New program</p>
      <div>
        <label className="label">Program name</label>
        <input name="name" required placeholder="4HR Foundation" className="input" />
      </div>
      <div>
        <label className="label">Description <span className="text-fg-muted font-normal">(optional)</span></label>
        <textarea name="description" rows={2} className="input resize-y" />
      </div>
      {state && !state.ok && <p className="text-xs text-red-500">{state.message}</p>}
      <button disabled={pending} className="btn btn-primary w-full">{pending ? "…" : "Create & build"}</button>
    </form>
  );
}
