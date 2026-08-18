"use client";
import { useActionState, useEffect, useRef } from "react";
import { inviteClient } from "@/lib/actions";

export function InviteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(inviteClient, null as null | { ok: boolean; message: string });

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card p-4">
      <label htmlFor="invite-email" className="label">Invite a client</label>
      <div className="flex gap-2">
        <input id="invite-email" name="email" type="email" required placeholder="client@email.com" className="input" />
        <button type="submit" disabled={pending} className="btn btn-primary shrink-0">
          {pending ? "…" : "Invite"}
        </button>
      </div>
      {state && (
        <p className={`mt-2 text-xs ${state.ok ? "text-brand" : "text-red-500"}`}>{state.message}</p>
      )}
    </form>
  );
}
