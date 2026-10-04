"use client";

import { closeCashAction, openCashAction, voidSaleAction } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";

export function OpenCashForm() {
  return (
    <ActionForm action={openCashAction} className="flex flex-wrap items-end gap-2" hideOk>
      <div className="min-w-40 flex-1">
        <label className="label" htmlFor="opening_cash">
          Efectivo inicial
        </label>
        <input id="opening_cash" name="opening_cash" className="input" inputMode="decimal" placeholder="0" required />
      </div>
      <button className="btn btn-primary">Abrir caja</button>
    </ActionForm>
  );
}

export function CloseCashForm({ expected }: { expected: number }) {
  return (
    <ActionForm
      action={closeCashAction}
      className="space-y-3"
      confirm="¿Cerrar la caja del día? No se podrán registrar más cobros hasta abrir otra."
    >
      <div>
        <label className="label" htmlFor="counted_cash">
          Efectivo contado en caja
        </label>
        <input
          id="counted_cash"
          name="counted_cash"
          className="input"
          inputMode="decimal"
          placeholder={String(expected)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="notes">
          Observaciones
        </label>
        <input id="notes" name="notes" className="input" placeholder="Opcional" />
      </div>
      <button className="btn btn-primary w-full">Cerrar caja y hacer arqueo</button>
    </ActionForm>
  );
}

export function VoidSaleButton({ id }: { id: number }) {
  return (
    <ActionForm action={voidSaleAction} confirm="¿Anular este cobro? Se devolverá el stock." hideOk>
      <input type="hidden" name="id" value={id} />
      <button className="text-xs text-red-600 hover:underline">Anular</button>
    </ActionForm>
  );
}
