import { getDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { Money, PageHeader } from "@/components/ui";
import { OpenCashForm } from "./caja/CashForms";
import { Pos } from "./Pos";

export default async function PosPage() {
  const db = getDb();
  const session = repo.getOpenCashSession(db);
  const breakdown = session ? repo.cashBreakdown(db, session.id) : null;
  const barbers = repo.listBarbers(db, true);
  const services = repo.listServices(db, true);
  const products = repo.listProducts(db, true);

  return (
    <>
      <PageHeader
        title="Cobrar"
        subtitle="Buscá al cliente por nombre, DNI o teléfono y registrá el cobro."
        actions={
          breakdown && (
            <div className="text-right text-sm text-stone-500">
              Hoy: <b className="text-stone-900">{breakdown.count}</b> cobros ·{" "}
              <Money value={breakdown.total} className="font-semibold text-stone-900" />
            </div>
          )
        }
      />
      {!session ? (
        <div className="card mx-auto max-w-md">
          <h2 className="mb-1 text-lg font-bold">Abrí la caja para empezar</h2>
          <p className="mb-4 text-sm text-stone-500">
            Declará el efectivo inicial con el que arranca la jornada.
          </p>
          <OpenCashForm />
        </div>
      ) : barbers.length === 0 || services.length === 0 ? (
        <div className="card text-sm">
          Antes de cobrar cargá al menos un{" "}
          <a className="font-semibold underline" href="/barberos">
            barbero
          </a>{" "}
          y un{" "}
          <a className="font-semibold underline" href="/catalogo">
            servicio
          </a>
          .
        </div>
      ) : (
        <Pos barbers={barbers} services={services} products={products} />
      )}
    </>
  );
}
