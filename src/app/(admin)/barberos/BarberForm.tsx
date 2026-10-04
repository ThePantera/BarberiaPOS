"use client";

import { saveBarberAction } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";
import type { Barber } from "@/lib/repo";

export function BarberForm({ barber }: { barber?: Barber }) {
  return (
    <ActionForm
      action={saveBarberAction}
      className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_140px_auto]"
      resetOnSuccess={!barber}
    >
      {barber && <input type="hidden" name="id" value={barber.id} />}
      <div>
        <label className="label">Nombre</label>
        <input name="name" className="input" defaultValue={barber?.name} required />
      </div>
      <div>
        <label className="label">Teléfono</label>
        <input name="phone" className="input" inputMode="tel" defaultValue={barber?.phone ?? ""} />
      </div>
      <div>
        <label className="label">Comisión %</label>
        <input
          name="commission_pct"
          className="input"
          inputMode="decimal"
          defaultValue={barber?.commission_pct ?? 50}
          required
        />
      </div>
      <button className="btn btn-primary">{barber ? "Guardar" : "Agregar"}</button>
    </ActionForm>
  );
}
