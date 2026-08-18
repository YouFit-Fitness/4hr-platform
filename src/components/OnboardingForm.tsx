"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitOnboarding } from "@/lib/actions";
import { onboardingSections, type OnboardingField } from "@/lib/onboarding";

export function OnboardingForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitOnboarding, null as null | { ok: boolean; message: string });

  useEffect(() => {
    if (state?.ok) router.push("/");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-8">
      {onboardingSections.map((section) => (
        <fieldset key={section.id} className="space-y-4">
          <legend className="eyebrow mb-1">{section.title}</legend>
          {section.fields.map((f) => (
            <Field key={f.key} field={f} />
          ))}
        </fieldset>
      ))}

      {state && !state.ok && <p className="text-sm text-red-500">{state.message}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Submitting…" : "Submit onboarding"}
      </button>
    </form>
  );
}

function Field({ field }: { field: OnboardingField }) {
  const id = `f_${field.key}`;
  const req = field.required;
  return (
    <div>
      <label htmlFor={id} className="label">
        {field.label}
        {!req && <span className="text-fg-muted font-normal"> (optional)</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea id={id} name={field.key} required={req} placeholder={field.placeholder} rows={3} className="input resize-y" />
      ) : field.type === "select" ? (
        <select id={id} name={field.key} required={req} defaultValue="" className="input">
          <option value="" disabled>
            Choose…
          </option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.key}
          type={field.type}
          required={req}
          placeholder={field.placeholder}
          inputMode={field.type === "number" ? "numeric" : undefined}
          className="input"
        />
      )}
      {field.help && <p className="mt-1 text-xs text-fg-muted">{field.help}</p>}
    </div>
  );
}
