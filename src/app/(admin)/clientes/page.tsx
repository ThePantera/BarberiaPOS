import Link from "next/link";
import { getDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { SEGMENTS, type Segment } from "@/lib/domain";
import { campaignLink } from "@/lib/whatsapp";
import { formatDate, Money, PageHeader, SegmentChip } from "@/components/ui";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ segmento?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const db = getDb();
  const settings = repo.getSettings(db);
  const all = repo.listClientsWithStats(db);
  const segment = SEGMENTS.find((s) => s.value === sp.segmento)?.value;
  const q = (sp.q ?? "").trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const clients = all.filter(
    (c) =>
      (!segment || c.segment === segment) &&
      (!q ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (qDigits && (c.dni?.includes(qDigits) || c.phone.replace(/\D/g, "").includes(qDigits)))),
  );
  const count = (s: Segment) => all.filter((c) => c.segment === s).length;
  const href = (s?: string) => `/clientes${s ? `?segmento=${s}` : ""}`;

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${all.length} clientes registrados`} />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {SEGMENTS.map((s) => (
          <Link
            key={s.value}
            href={segment === s.value ? href() : href(s.value)}
            className={`rounded-2xl border-2 p-4 transition ${
              segment === s.value ? "border-brand-500 bg-brand-50" : "border-transparent bg-white hover:border-stone-200"
            }`}
          >
            <div className="text-3xl font-bold tabular-nums">{count(s.value)}</div>
            <div className="font-semibold">{s.label}</div>
            <div className="text-xs text-stone-500">{s.hint}</div>
          </Link>
        ))}
      </div>

      <form className="mb-4 flex gap-2">
        {segment && <input type="hidden" name="segmento" value={segment} />}
        <input name="q" className="input" placeholder="Buscar por nombre, DNI o teléfono" defaultValue={sp.q} />
        <button className="btn">Buscar</button>
      </form>

      {segment && (
        <p className="mb-3 text-sm text-stone-500">
          Mostrando <b>{SEGMENTS.find((s) => s.value === segment)!.label.toLowerCase()}</b>. El botón de WhatsApp abre
          la plantilla de este segmento (editala en <Link className="underline" href="/configuracion">Ajustes</Link>).
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Segmento</th>
              <th className="text-right">Visitas mes</th>
              <th className="text-right">Total gastado</th>
              <th>Última visita</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/clientes/${c.id}`} className="font-semibold hover:underline">
                    {c.first_name} {c.last_name}
                  </Link>
                  <span className="block text-xs text-stone-500">{c.phone}</span>
                </td>
                <td><SegmentChip segment={c.segment} /></td>
                <td className="text-right tabular-nums">{c.visits_month}</td>
                <td className="text-right"><Money value={c.total_spent} /></td>
                <td className="text-sm">
                  {c.last_visit ? (
                    <>
                      {formatDate(c.last_visit)}
                      <span className="block text-xs text-stone-500">hace {c.days_since} días</span>
                    </>
                  ) : (
                    <span className="text-stone-400">Sin visitas</span>
                  )}
                </td>
                <td className="text-right">
                  <a
                    href={campaignLink(c, settings, segment ?? c.segment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    WhatsApp
                  </a>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-stone-500">No hay clientes para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
