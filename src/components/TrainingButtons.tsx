import { deleteExercise, deleteProgramDay, removeProgramExercise, moveProgramExercise, setExerciseArchived } from "@/lib/training";

/** Small delete controls that submit bound server actions (server-safe forms). */

export function DeleteExerciseButton({ id }: { id: string }) {
  return (
    <form action={deleteExercise.bind(null, id)}>
      <button className="text-xs text-fg-muted hover:text-red-500 transition-colors">Delete</button>
    </form>
  );
}

export function ArchiveExerciseButton({ id, archived }: { id: string; archived: boolean }) {
  return (
    <form action={setExerciseArchived.bind(null, id, !archived)}>
      <button className="text-xs text-fg-muted hover:text-fg transition-colors">{archived ? "Restore" : "Archive"}</button>
    </form>
  );
}

export function DeleteDayButton({ dayId, programId }: { dayId: string; programId: string }) {
  return (
    <form action={deleteProgramDay.bind(null, dayId, programId)}>
      <button className="text-xs text-fg-muted hover:text-red-500 transition-colors">Remove day</button>
    </form>
  );
}

export function RemoveProgramExerciseButton({ id, programId }: { id: string; programId: string }) {
  return (
    <form action={removeProgramExercise.bind(null, id, programId)}>
      <button className="text-xs text-fg-muted hover:text-red-500 transition-colors" aria-label="Remove exercise">✕</button>
    </form>
  );
}

/** Move an exercise up/down within its day. */
export function MoveExerciseButtons({ id, programId, isFirst, isLast }: { id: string; programId: string; isFirst: boolean; isLast: boolean }) {
  const cls = "flex h-6 w-6 items-center justify-center rounded border border-line text-xs text-fg-muted hover:text-fg hover:border-fg-muted disabled:opacity-30";
  return (
    <div className="flex items-center gap-1">
      <form action={moveProgramExercise.bind(null, id, programId, "up")}>
        <button className={cls} disabled={isFirst} aria-label="Move up">↑</button>
      </form>
      <form action={moveProgramExercise.bind(null, id, programId, "down")}>
        <button className={cls} disabled={isLast} aria-label="Move down">↓</button>
      </form>
    </div>
  );
}
