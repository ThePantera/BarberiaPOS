"use client";

import { saveRuleAction, saveSettingsAction } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";
import type { LoyaltyRule } from "@/lib/domain";

export function RuleForm({ rule }: { rule?: LoyaltyRule }) {
  return (
    <ActionForm
      action={saveRuleAction}
      className="grid items-end gap-2 sm:grid-cols-[1fr_130px_130px_auto]"
      resetOnSuccess={!rule}
    >
      {rule && <input type="hidden" name="id" value={rule.id} />}
      <div>
        <label className="label">Nombre de la promo</label>
        <input name="name" className="input" defaultValue={rule?.name} placeholder="Ej: 3.ª visita del mes" />
      </div>
      <div>
        <label className="label">En la visita n.º</label>
        <input name="visits_required" className="input" inputMode="numeric" defaultValue={rule?.visits_required ?? 3} required />
      </div>
      <div>
        <label className="label">Descuento %</label>
        <input name="discount_pct" className="input" inputMode="decimal" defaultValue={rule?.discount_pct ?? 20} required />
      </div>
      <button className="btn btn-primary">{rule ? "Guardar" : "Agregar"}</button>
    </ActionForm>
  );
}

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  return (
    <ActionForm action={saveSettingsAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nombre de la barbería</label>
          <input name="shop_name" className="input" defaultValue={settings.shop_name} required />
        </div>
        <div>
          <label className="label">Prefijo WhatsApp (país)</label>
          <input name="whatsapp_prefix" className="input" inputMode="numeric" defaultValue={settings.whatsapp_prefix} />
          <p className="mt-1 text-xs text-stone-500">Argentina: 549. Se antepone a los teléfonos guardados sin código de país.</p>
        </div>
      </div>
      <p className="text-xs text-stone-500">
        Variables disponibles en las plantillas: <code>{"{nombre}"}</code>, <code>{"{apellido}"}</code>,{" "}
        <code>{"{barberia}"}</code>, <code>{"{visitas}"}</code> (visitas del mes), <code>{"{dias}"}</code> (días desde la última visita).
      </p>
      {[
        ["tpl_fiel", "Plantilla · Clientes fieles"],
        ["tpl_regular", "Plantilla · Frecuencia regular (recordatorio)"],
        ["tpl_riesgo", "Plantilla · Inactivos / En riesgo"],
      ].map(([k, label]) => (
        <div key={k}>
          <label className="label">{label}</label>
          <textarea name={k} className="input" rows={3} defaultValue={settings[k]} />
        </div>
      ))}
      <button className="btn btn-primary">Guardar ajustes</button>
    </ActionForm>
  );
}
