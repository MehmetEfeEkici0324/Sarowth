"use client";

import { useFormStatus } from "react-dom";

interface FormSubmitProps {
  idleLabel: string;
  pendingLabel?: string;
}

export function FormSubmit({ idleLabel, pendingLabel = "Kaydediliyor..." }: FormSubmitProps) {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit" className="rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 font-semibold text-[#03110c] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
