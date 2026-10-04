"use client";

import { updateClientAction } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";
import type { Client } from "@/lib/repo";

export function ClientForm({ client }: { client: Client }) {
  return (
    <ActionForm action={updateClientAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={client.id} />
      <div>
        <label className="label">Nombre</label>
        <input name="first_name" className="input" defaultValue={client.first_name} required />
      </div>
      <div>
        <label className="label">Apellido</label>
        <input name="last_name" className="input" defaultValue={client.last_name} required />
      </div>
      <div>
        <label className="label">Teléfono</label>
        <input name="phone" className="input" inputMode="tel" defaultValue={client.phone} required />
      </div>
      <div>
        <label className="label">DNI</label>
        <input name="dni" className="input" inputMode="numeric" defaultValue={client.dni ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Notas</label>
        <textarea name="notes" className="input" rows={2} defaultValue={client.notes ?? ""} placeholder="Preferencias, tipo de corte…" />
      </div>
      <div className="sm:col-span-2">
        <button className="btn btn-primary">Guardar cambios</button>
      </div>
    </ActionForm>
  );
}
