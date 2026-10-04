import Link from "next/link";
import { getDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { addDays, endOfMonth, localDate, startOfWeek } from "@/lib/time";
import { formatDate, formatDateTime, Money, PageHeader } from "@/components/ui";

function range(period: string, ref: string) {
  if (period === "mes") {
    const from = ref.slice(0, 7) + "-01";
    return { from, to: endOfMonth(ref.slice(0, 7)), prev: addDays(from, -1), next: addDays(endOfMonth(ref.slice(0, 7)), 1) };
  }
  const from = startOfWeek(ref);
  return { from, to: addDays(from, 6), prev: addDays(from, -7), next: addDays(from, 7) };
}

export default async function LiquidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; fecha?: string }>;
}) {
  const sp = await searchParams;
  const period = sp.periodo === "mes" ? "mes" : "semana";
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha ?? "") ? sp.fecha! : localDate();
  const { from, to, prev, next } = range(period, ref);
  const { lines, detail } = repo.commissionReport(getDb(), from, to);
  const totalCommission = lines.reduce((a, l) => a + l.commission, 0);
  const href = (p: string, f: string) => `/barberos/liquidacion?periodo=${p}&fecha=${f}`;

  return (
    <>
      <PageHeader
        title="Liquidación de comisiones"
        subtitle={`Del ${formatDate(from)} al ${formatDate(to)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className={`btn btn-sm ${period === "semana" ? "btn-primary" : ""}`} href={href("semana", ref)}>
              Semanal
            </Link>
            <Link className={`btn btn-sm ${period === "mes" ? "btn-primary" : ""}`} href={href("mes", ref)}>
              Mensual
            </Link>
            <Link className="btn btn-sm" href={href(period, prev)}>← Anterior</Link>
            <Link className="btn btn-sm" href={href(period, next)}>Siguiente →</Link>
          </div>
        }
      />
      <div className="card mb-4 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Barbero</th>
              <th className="text-right">Cortes</th>
              <th className="text-right">Facturado (servicios)</th>
              <th className="text-right">A pagar</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.barber_id}>
                <td className="font-semibold">{l.barber_name}<span className="block text-xs font-normal text-stone-500">{l.commission_pct}% base</span></td>
                <td className="text-right tabular-nums">{l.cuts}</td>
                <td className="text-right"><Money value={l.service_net} /></td>
                <td className="text-right text-lg font-bold"><Money value={l.commission} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-semibold">Total comisiones</td>
              <td className="text-right text-lg font-bold"><Money value={totalCommission} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <details className="card">
        <summary className="cursor-pointer font-bold">Detalle de cortes ({detail.length})</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Barbero</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th className="text-right">Neto servicio</th>
                <th className="text-right">Comisión</th>
              </tr>
            </thead>
            <tbody>
              {detail.map((s) => (
                <tr key={s.id}>
                  <td>{formatDateTime(s.created_at)}</td>
                  <td>{s.barber_name}</td>
                  <td>{s.client_name}</td>
                  <td>{s.service_name}</td>
                  <td className="text-right"><Money value={s.service_price - s.discount_amount} /></td>
                  <td className="text-right font-semibold"><Money value={s.commission} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
