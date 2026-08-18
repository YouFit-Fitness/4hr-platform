import { deleteExercise, deleteProgramDay, removeProgramExercise } from "@/lib/training";

/** Small delete controls that submit bound server actions (server-safe forms). */

export function DeleteExerciseButton({ id }: { id: string }) {
  return (
    <form action={deleteExercise.bind(null, id)}>
      <button className="text-xs text-fg-muted hover:text-red-500 transition-colors">Delete</button>
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
      <button className="text-xs text-fg-muted hover:text-red-500 transition-colors">✕</button>
    </form>
  );
}
