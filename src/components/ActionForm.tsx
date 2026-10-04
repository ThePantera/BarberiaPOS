"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/app/actions";

type Props = {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
  hideOk?: boolean;
};

/** Formulario que muestra el error u OK devuelto por la Server Action. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  confirm,
  hideOk,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state?.error && (
        <p className="mt-2 w-full text-sm font-medium text-red-600">{state.error}</p>
      )}
      {state?.ok && !hideOk && (
        <p className="mt-2 w-full text-sm font-medium text-emerald-700">{state.ok}</p>
      )}
    </form>
  );
}
