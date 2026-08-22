"use client";
import { useActionState } from "react";
import { deleteProgram } from "@/lib/training";

export function DeleteProgramButton({ programId }: { programId: string }) {
  const [state, action, pending] = useActionState(deleteProgram, null as null | { ok: boolean; message: string });

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this program? This can't be undone.")) e.preventDefault();
      }}
      className="text-right"
    >
      <input type="hidden" name="programId" value={programId} />
      <button disabled={pending} className="btn btn-ghost text-xs text-red-400">
        {pending ? "Deleting…" : "Delete program"}
      </button>
      {state && !state.ok && <p className="mt-1 text-xs text-red-500">{state.message}</p>}
    </form>
  );
}
