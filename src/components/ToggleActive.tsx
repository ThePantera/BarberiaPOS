"use client";

import { toggleActiveAction } from "@/app/actions";
import { ActionForm } from "./ActionForm";

export function ToggleActive({
  table,
  id,
  active,
}: {
  table: "barbers" | "services" | "products" | "loyalty_rules";
  id: number;
  active: boolean;
}) {
  return (
    <ActionForm action={toggleActiveAction} hideOk>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "0" : "1"} />
      <button className={`btn btn-sm ${active ? "" : "btn-brand"}`}>
        {active ? (table === "loyalty_rules" ? "Pausar" : "Dar de baja") : "Reactivar"}
      </button>
    </ActionForm>
  );
}
