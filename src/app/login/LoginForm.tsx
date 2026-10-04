"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="label" htmlFor="password">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        className="input"
        autoFocus
        required
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
