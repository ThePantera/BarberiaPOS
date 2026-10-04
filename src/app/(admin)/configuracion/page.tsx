import { getDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { logout } from "@/app/actions";
import { PageHeader } from "@/components/ui";
import { ToggleActive } from "@/components/ToggleActive";
import { RuleForm, SettingsForm } from "./Forms";

export default async function ConfiguracionPage() {
  const db = getDb();
  const rules = repo.listLoyaltyRules(db);
  const settings = repo.getSettings(db);

  return (
    <>
      <PageHeader
        title="Ajustes"
        actions={
          <form action={logout}>
            <button className="btn btn-sm">Cerrar sesión</button>
          </form>
        }
      />
      <section className="mb-8">
        <h2 className="text-lg font-bold">Motor de fidelización</h2>
        <p className="mb-3 text-sm text-stone-500">
          Cuando un cliente llega a la visita indicada dentro del mes, el POS muestra la alerta y aplica el descuento
          sobre el servicio automáticamente. El contador se reinicia cada mes.
        </p>
        <div className="card mb-3">
          <RuleForm />
        </div>
        <div className="space-y-2">
          {rules.map((r) => (
            <details key={r.id} className={`card ${r.active ? "" : "opacity-60"}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="font-semibold">
                  {r.name}
                  {!r.active && <span className="chip ml-2 bg-stone-200 text-stone-600">Pausada</span>}
                  <span className="block text-sm font-normal text-stone-500">
                    Visita n.º {r.visits_required} del mes = {r.discount_pct}% de descuento
                  </span>
                </span>
                <span className="text-sm text-stone-400">Editar ▾</span>
              </summary>
              <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                <RuleForm rule={r} />
                <ToggleActive table="loyalty_rules" id={r.id} active={!!r.active} />
              </div>
            </details>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">Barbería y WhatsApp</h2>
        <div className="card">
          <SettingsForm settings={settings} />
        </div>
      </section>
    </>
  );
}
