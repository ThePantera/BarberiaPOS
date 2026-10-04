import Link from "next/link";
import { getDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { PageHeader } from "@/components/ui";
import { ToggleActive } from "@/components/ToggleActive";
import { BarberForm } from "./BarberForm";

export default async function BarberosPage() {
  const barbers = repo.listBarbers(getDb());
  return (
    <>
      <PageHeader
        title="Barberos"
        subtitle="Equipo de trabajo y porcentaje de comisión de cada uno."
        actions={
          <Link href="/barberos/liquidacion" className="btn btn-brand">
            Liquidación de comisiones
          </Link>
        }
      />
      <div className="card mb-4">
        <h2 className="mb-3 font-bold">Nuevo barbero</h2>
        <BarberForm />
      </div>
      <div className="space-y-3">
        {barbers.map((b) => (
          <details key={b.id} className={`card ${b.active ? "" : "opacity-60"}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span>
                <span className="font-semibold">{b.name}</span>
                {!b.active && <span className="chip ml-2 bg-stone-200 text-stone-600">De baja</span>}
                <span className="block text-sm text-stone-500">
                  {b.commission_pct}% de comisión{b.phone ? ` · ${b.phone}` : ""}
                </span>
              </span>
              <span className="text-sm text-stone-400">Editar ▾</span>
            </summary>
            <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
              <BarberForm barber={b} />
              <ToggleActive table="barbers" id={b.id} active={!!b.active} />
            </div>
          </details>
        ))}
        {barbers.length === 0 && <p className="text-sm text-stone-500">Todavía no cargaste barberos.</p>}
      </div>
    </>
  );
}
