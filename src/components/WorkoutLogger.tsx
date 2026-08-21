"use client";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { logWorkout } from "@/lib/client-actions";

type Item = {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: string | null;
  cues: string | null;
  videoUrl: string | null;
  targetSets: number | null;
  targetReps: string | null;
  targetRpe: string | null;
  restSeconds: number | null;
  notes: string;
};
type SetEntry = { weight: string; reps: string; rpe: string };
type PrevSet = { setNo: number; weight: string | null; reps: number | null; rpe: string | null };

const blankSet = (): SetEntry => ({ weight: "", reps: "", rpe: "" });
const isFilled = (s: SetEntry) => s.weight.trim() !== "" || s.reps.trim() !== "" || s.rpe.trim() !== "";
const fmtPrev = (s: PrevSet) => `${s.weight ?? "—"}${s.reps != null ? `×${s.reps}` : ""}${s.rpe ? ` @${s.rpe}` : ""}`;

function prescription(sets: number | null, reps: string | null, rpe: string | null): string | null {
  let main = "";
  if (sets != null && reps) main = `${sets} ${sets === 1 ? "set" : "sets"} × ${reps} reps`;
  else if (sets != null) main = `${sets} ${sets === 1 ? "set" : "sets"}`;
  else if (reps) main = `${reps} reps`;
  const rpeStr = rpe ? `RPE ${rpe}` : "";
  return [main, rpeStr].filter(Boolean).join(" · ") || null;
}
function fmtRest(sec: number | null): string | null {
  if (!sec) return null;
  if (sec < 60) return `${sec}s rest`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m${s ? ` ${s}s` : ""} rest`;
}
function parseCues(cues: string | null): string[] {
  if (!cues) return [];
  return cues.split(/\r?\n|;|•|•/).map((c) => c.trim()).filter(Boolean);
}
function parseVideo(url: string): { embed: string | null; href: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { embed: `https://www.youtube.com/embed/${id}`, href: url };
    }
    if (host.endsWith("youtube.com")) {
      const id =
        u.searchParams.get("v") ||
        (u.pathname.startsWith("/embed/") || u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : null);
      if (id) return { embed: `https://www.youtube.com/embed/${id}`, href: url };
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (/^\d+$/.test(id)) return { embed: `https://player.vimeo.com/video/${id}`, href: url };
    }
    return { embed: null, href: url };
  } catch {
    return { embed: null, href: url };
  }
}

export function WorkoutLogger({
  dayId,
  dayTitle,
  items,
  lastByExerciseId = {},
  lastPerformedOn = null,
}: {
  dayId: string;
  dayTitle: string;
  items: Item[];
  lastByExerciseId?: Record<string, PrevSet[]>;
  lastPerformedOn?: string | null;
}) {
  const action = logWorkout.bind(null, dayId);
  const [state, formAction, pending] = useActionState(action, null as null | { ok: boolean; message: string });

  const [sets, setSets] = useState<Record<string, SetEntry[]>>(() =>
    Object.fromEntries(items.map((it) => [it.id, Array.from({ length: Math.max(1, it.targetSets ?? 3) }, blankSet)])),
  );

  const filledSets = useMemo(() => Object.values(sets).flat().filter(isFilled).length, [sets]);
  const filledExercises = useMemo(() => items.filter((it) => (sets[it.id] ?? []).some(isFilled)).length, [items, sets]);

  const payload = useMemo(
    () =>
      JSON.stringify(
        items.map((it) => ({
          exerciseId: it.exerciseId,
          exerciseName: it.name,
          sets: (sets[it.id] ?? []).map((s) => ({
            weight: s.weight,
            reps: s.reps === "" ? undefined : Number(s.reps),
            rpe: s.rpe,
          })),
        })),
      ),
    [items, sets],
  );

  function update(itemId: string, idx: number, field: keyof SetEntry, value: string) {
    setSets((prev) => {
      const arr = [...(prev[itemId] ?? [])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [itemId]: arr };
    });
  }
  const addSet = (itemId: string) => setSets((p) => ({ ...p, [itemId]: [...(p[itemId] ?? []), blankSet()] }));
  const removeSet = (itemId: string) =>
    setSets((p) => {
      const arr = p[itemId] ?? [];
      return arr.length <= 1 ? p : { ...p, [itemId]: arr.slice(0, -1) };
    });

  // ── Completion confirmation ───────────────────────────────────────────────
  if (state?.ok) {
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand/50 text-brand">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-4 text-xl font-bold">Workout logged</h2>
        <p className="mt-1 text-sm text-fg-muted">{dayTitle} · {today}</p>
        <p className="mt-3 text-sm">
          <span className="font-semibold text-fg">{filledSets}</span> {filledSets === 1 ? "set" : "sets"} across{" "}
          <span className="font-semibold text-fg">{filledExercises}</span> {filledExercises === 1 ? "exercise" : "exercises"}
        </p>
        <Link href="/train" className="btn btn-primary mt-6 w-full sm:w-auto sm:px-10">Back to your training</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="pb-28">
      {/* Top progress — orientation only */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{filledExercises} of {items.length} exercises logged</span>
          <span className="text-fg-muted tabular-nums">{filledSets} {filledSets === 1 ? "set" : "sets"}</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-line overflow-hidden">
          <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${items.length ? (filledExercises / items.length) * 100 : 0}%` }} />
        </div>
      </div>

      <input type="hidden" name="payload" value={payload} />

      <div className="space-y-4">
        {items.map((it, i) => (
          <ExerciseCard
            key={it.id}
            item={it}
            index={i}
            total={items.length}
            entries={sets[it.id] ?? []}
            prev={lastByExerciseId[it.exerciseId] ?? []}
            lastPerformedOn={lastPerformedOn}
            onUpdate={update}
            onAddSet={addSet}
            onRemoveSet={removeSet}
          />
        ))}
      </div>

      {/* Session notes — secondary */}
      <section className="mt-4 card p-4">
        <label htmlFor="notes" className="text-sm font-medium">Session notes <span className="text-fg-muted font-normal">(optional)</span></label>
        <textarea id="notes" name="notes" rows={2} className="input resize-y mt-2 text-sm" placeholder="How did it feel? Any pain, PRs, substitutions…" />
      </section>

      {/* Sticky completion bar (safe-area aware) */}
      <div
        className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur px-4 pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-xl flex items-center gap-3">
          <p className="flex-1 text-sm min-w-0">
            {state && !state.ok ? (
              <span className="text-red-500">{state.message}</span>
            ) : filledSets === 0 ? (
              <span className="text-fg-muted">Log at least one set to finish</span>
            ) : (
              <span className="text-fg-muted tabular-nums">{filledSets} {filledSets === 1 ? "set" : "sets"} · {filledExercises}/{items.length} exercises</span>
            )}
          </p>
          <button disabled={pending || filledSets === 0} className="btn btn-primary shrink-0 px-6">
            {pending ? "Saving…" : `Complete ${dayTitle}`}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── One exercise: header, prescription, demo, cues, last session, set log ─── */
function ExerciseCard({
  item,
  index,
  total,
  entries,
  prev,
  lastPerformedOn,
  onUpdate,
  onAddSet,
  onRemoveSet,
}: {
  item: Item;
  index: number;
  total: number;
  entries: SetEntry[];
  prev: PrevSet[];
  lastPerformedOn: string | null;
  onUpdate: (itemId: string, idx: number, field: keyof SetEntry, value: string) => void;
  onAddSet: (itemId: string) => void;
  onRemoveSet: (itemId: string) => void;
}) {
  const rx = prescription(item.targetSets, item.targetReps, item.targetRpe);
  const rest = fmtRest(item.restSeconds);
  const cues = parseCues(item.cues);

  return (
    <section className="card p-4 sm:p-5" aria-label={`Exercise ${index + 1}: ${item.name}`}>
      {/* Header */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Exercise {index + 1} of {total}</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold leading-tight">{item.name}</h2>
        {item.muscleGroup && (
          <span className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-[11px] text-fg-muted">{item.muscleGroup}</span>
        )}
      </div>

      {/* Prescription (target) */}
      {(rx || rest) && (
        <p className="mt-1.5 text-sm">
          {rx && <span className="text-fg-muted">Target: </span>}
          {rx && <span className="font-medium">{rx}</span>}
          {rest && <span className="text-fg-muted">{rx ? " · " : ""}{rest}</span>}
        </p>
      )}
      {item.notes && <p className="mt-1 text-xs text-fg-muted">{item.notes}</p>}

      {/* Demo video + coaching cues */}
      {item.videoUrl && <DemoVideo url={item.videoUrl} name={item.name} />}
      {cues.length > 0 && (
        <div className="mt-3 rounded-lg border border-line/70 bg-surface/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Coaching cues</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {cues.map((c, i) => (
              <li key={i} className="flex gap-2"><span className="text-brand" aria-hidden="true">·</span><span>{c}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* Last session */}
      {prev.length > 0 && (
        <p className="mt-3 text-xs text-fg-muted">
          <span className="font-medium text-fg">Last session{lastPerformedOn ? " " : ""}</span>
          {lastPerformedOn ? <span>({lastPerformedOn}) </span> : " "}
          — {prev.map(fmtPrev).join(",  ")}
        </p>
      )}

      {/* Set log */}
      <div className="mt-4">
        <div className="grid grid-cols-[1.75rem_1fr_1fr_1fr] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-fg-muted">
          <span>Set</span><span>Weight (kg)</span><span>Reps</span><span>RPE</span>
        </div>
        <div className="mt-1.5 space-y-1.5">
          {entries.map((s, idx) => {
            const done = isFilled(s);
            return (
              <div key={idx} className="grid grid-cols-[1.75rem_1fr_1fr_1fr] gap-2 items-center">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs tabular-nums transition-colors ${
                    done ? "border border-brand/60 text-fg font-medium" : "border border-line text-fg-muted"
                  }`}
                >
                  {idx + 1}
                </span>
                <input aria-label={`Set ${idx + 1} weight in kg`} inputMode="decimal" value={s.weight}
                  onChange={(e) => onUpdate(item.id, idx, "weight", e.target.value)} placeholder="kg"
                  className="input h-11 py-0 text-center" />
                <input aria-label={`Set ${idx + 1} reps`} inputMode="numeric" value={s.reps}
                  onChange={(e) => onUpdate(item.id, idx, "reps", e.target.value)} placeholder="reps"
                  className="input h-11 py-0 text-center" />
                <input aria-label={`Set ${idx + 1} RPE`} inputMode="decimal" value={s.rpe}
                  onChange={(e) => onUpdate(item.id, idx, "rpe", e.target.value)} placeholder="RPE"
                  className="input h-11 py-0 text-center" />
              </div>
            );
          })}
        </div>

        {/* Add / remove — low hierarchy, remove is subtle */}
        <div className="mt-2.5 flex items-center justify-between">
          <button type="button" onClick={() => onAddSet(item.id)}
            className="text-xs font-medium text-brand hover:underline">+ Add set</button>
          {entries.length > 1 && (
            <button type="button" onClick={() => onRemoveSet(item.id)}
              className="text-xs text-fg-muted hover:text-fg">Remove last</button>
          )}
        </div>
      </div>
    </section>
  );
}

/* Click-to-load demo. Embeds YouTube/Vimeo responsively; else opens the source. */
function DemoVideo({ url, name }: { url: string; name: string }) {
  const [open, setOpen] = useState(false);
  const { embed, href } = parseVideo(url);

  if (!embed) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
        <PlayIcon /> View exercise demo
      </a>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
        <PlayIcon /> Watch demo
      </button>
    );
  }
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-line" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        src={embed}
        title={`${name} demonstration`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
