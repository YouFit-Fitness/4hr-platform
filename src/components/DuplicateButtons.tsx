"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateProgram, duplicateProgramDay } from "@/lib/training";

/** Duplicate a whole program, then open the copy in the builder. */
export function DuplicateProgramButton({ programId }: { programId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await duplicateProgram(programId);
          if (res.ok && res.id) router.push(`/coach/programs/${res.id}`);
          else router.refresh();
        })
      }
      className="text-xs text-fg-muted hover:text-fg transition-colors disabled:opacity-50"
    >
      {pending ? "Duplicating…" : "Duplicate"}
    </button>
  );
}

/** Duplicate one workout day within the same program. */
export function DuplicateDayButton({ dayId, programId }: { dayId: string; programId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => duplicateProgramDay(dayId, programId))}
      className="text-xs text-fg-muted hover:text-fg transition-colors disabled:opacity-50"
    >
      {pending ? "…" : "Duplicate"}
    </button>
  );
}
