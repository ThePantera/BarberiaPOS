import { getDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { formatDateTime, Money, PageHeader, PAYMENT_LABEL } from "@/components/ui";
import { CloseCashForm, OpenCashForm, VoidSaleButton } from "./CashForms";

export default async function CajaPage() {
  const db = getDb();
  const session = repo.getOpenCashSession(db);
  const history = repo.listCashSessions(db, 15).filter((s) => s.closed_at);

  return (
    <>
      <PageHeader
        title="Caja"
        subtitle={
          session
            ? `Abierta desde ${formatDateTime(session.opened_at)}`
            : "No hay caja abierta"
        }
      />
      {session ? <OpenSession session={session} /> : (
        <div className="card mb-6 max-w-md">
          <h2 className="mb-3 font-bold">Apertura de caja</h2>
          <OpenCashForm />
        </div>
      )}

      <h2 className="mt-8 mb-3 text-lg font-bold">Cierres anteriores</h2>
      <div className="card overflow-x-auto">
        {history.length === 0 ? (
          <p className="text-sm text-stone-500">Todavía no hay cierres.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Apertura</th>
                <th>Cierre</th>
                <th className="text-right">Inicial</th>
                <th className="text-right">Esperado</th>
                <th className="text-right">Contado</th>
                <th className="text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s) => {
                const diff = (s.counted_cash ?? 0) - (s.expected_cash ?? 0);
                return (
                  <tr key={s.id}>
                    <td>{formatDateTime(s.opened_at)}</td>
                    <td>{formatDateTime(s.closed_at!)}</td>
                    <td className="text-right"><Money value={s.opening_cash} /></td>
                    <td className="text-right"><Money value={s.expected_cash ?? 0} /></td>
                    <td className="text-right"><Money value={s.counted_cash ?? 0} /></td>
                    <td className={`text-right font-semibold ${diff === 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {diff > 0 ? "+" : ""}
                      <Money value={diff} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function OpenSession({ session }: { session: repo.CashSession }) {
  const db = getDb();
  const b = repo.cashBreakdown(db, session.id);
  const sales = repo.listSalesForSession(db, session.id);
  const expected = session.opening_cash + b.efectivo;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Efectivo" value={b.efectivo} />
          <Tile label="Transferencias" value={b.transferencia} />
          <Tile label="Tarjetas" value={b.tarjeta} />
          <Tile label={`Total (${b.count} cobros)`} value={b.total} dark />
        </div>
        <div className="card overflow-x-auto">
          <h2 className="mb-2 font-bold">Movimientos de la jornada</h2>
          {sales.length === 0 ? (
            <p className="text-sm text-stone-500">Todavía no hay cobros.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Pago</th>
                  <th className="text-right">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="tabular-nums">{s.created_at.slice(11, 16)}</td>
                    <td>{s.client_name}</td>
                    <td>
                      {s.service_name}
                      <span className="block text-xs text-stone-500">
                        {s.barber_name}
                        {s.discount_amount > 0 && ` · ${s.discount_pct}% fidelidad`}
                        {s.products_total > 0 && " · + productos"}
                      </span>
                    </td>
                    <td>{PAYMENT_LABEL[s.payment_method]}</td>
                    <td className="text-right font-semibold"><Money value={s.total} /></td>
                    <td className="text-right"><VoidSaleButton id={s.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="card h-fit space-y-3">
        <h2 className="font-bold">Cierre y arqueo</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-stone-500">Efectivo inicial</dt><dd><Money value={session.opening_cash} /></dd></div>
          <div className="flex justify-between"><dt className="text-stone-500">+ Cobros en efectivo</dt><dd><Money value={b.efectivo} /></dd></div>
          <div className="flex justify-between border-t border-stone-200 pt-1 font-bold"><dt>Efectivo esperado</dt><dd><Money value={expected} /></dd></div>
          <div className="flex justify-between text-stone-500"><dt>Comisiones generadas</dt><dd><Money value={b.commissions} /></dd></div>
        </dl>
        <CloseCashForm expected={expected} />
      </div>
    </div>
  );
}

function Tile({ label, value, dark }: { label: string; value: number; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${dark ? "bg-ink text-white" : "border border-stone-200 bg-white"}`}>
      <div className={`text-xs ${dark ? "text-stone-400" : "text-stone-500"}`}>{label}</div>
      <Money value={value} className="text-xl font-bold" />
    </div>
  );
}
