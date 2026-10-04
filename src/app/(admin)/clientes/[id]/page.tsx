import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { campaignLink } from "@/lib/whatsapp";
import { formatDate, formatDateTime, Money, PageHeader, PAYMENT_LABEL, SegmentChip } from "@/components/ui";
import { ClientForm } from "./ClientForm";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const client = repo.getClient(db, Number(id));
  if (!client) notFound();
  const history = repo.clientHistory(db, client.id, 100);
  const settings = repo.getSettings(db);

  return (
    <>
      <PageHeader
        title={`${client.first_name} ${client.last_name}`}
        subtitle={<>Cliente desde el {formatDate(client.created_at)} · <SegmentChip segment={client.segment} /></>}
        actions={
          <a
            href={campaignLink(client, settings)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600"
          >
            Enviar WhatsApp
          </a>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Visitas este mes" value={String(client.visits_month)} />
        <Tile label="Visitas totales" value={String(client.visits_total)} />
        <Tile label="Total gastado" value={<Money value={client.total_spent} />} />
        <Tile
          label="Última visita"
          value={client.last_visit ? `hace ${client.days_since} d` : "—"}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-bold">Datos personales</h2>
          <ClientForm client={client} />
        </div>
        <div className="card overflow-x-auto">
          <h2 className="mb-2 font-bold">Historial de visitas</h2>
          {history.length === 0 ? (
            <p className="text-sm text-stone-500">Sin visitas registradas.</p>
          ) : (
            <table className="table">
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="whitespace-nowrap">{formatDateTime(h.created_at)}</td>
                    <td>
                      {h.service_name}
                      <span className="block text-xs text-stone-500">
                        {h.barber_name} · {PAYMENT_LABEL[h.payment_method]}
                        {h.discount_amount > 0 && ` · ${h.discount_pct}% fidelidad`}
                      </span>
                    </td>
                    <td className="text-right font-semibold"><Money value={h.total} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function Tile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
