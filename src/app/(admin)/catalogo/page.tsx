import { getDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { Money, PageHeader } from "@/components/ui";
import { ToggleActive } from "@/components/ToggleActive";
import { ProductForm, ServiceForm, StockAdjust } from "./Forms";

export default async function CatalogoPage() {
  const db = getDb();
  const services = repo.listServices(db);
  const products = repo.listProducts(db);
  const low = products.filter((p) => p.active && p.stock <= p.min_stock);

  return (
    <>
      <PageHeader title="Catálogo e inventario" subtitle="Servicios, precios y stock de productos." />

      <h2 className="mb-3 text-lg font-bold">Servicios</h2>
      <div className="card mb-3">
        <ServiceForm />
      </div>
      <div className="mb-8 space-y-2">
        {services.map((s) => (
          <details key={s.id} className={`card ${s.active ? "" : "opacity-60"}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="font-semibold">
                {s.name}
                {!s.active && <span className="chip ml-2 bg-stone-200 text-stone-600">De baja</span>}
                <span className="block text-xs font-normal text-stone-500">
                  {s.fixed_commission != null ? `Comisión fija $${s.fixed_commission.toLocaleString("es-AR")}` : "Comisión según % del barbero"}
                </span>
              </span>
              <Money value={s.price} className="text-lg font-bold" />
            </summary>
            <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
              <ServiceForm service={s} />
              <ToggleActive table="services" id={s.id} active={!!s.active} />
            </div>
          </details>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">Productos</h2>
      {low.length > 0 && (
        <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          ⚠️ Stock bajo: {low.map((p) => `${p.name} (${p.stock})`).join(", ")}
        </div>
      )}
      <div className="card mb-3">
        <ProductForm />
      </div>
      <div className="space-y-2">
        {products.map((p) => (
          <details key={p.id} className={`card ${p.active ? "" : "opacity-60"}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="font-semibold">
                {p.name}
                {!p.active && <span className="chip ml-2 bg-stone-200 text-stone-600">De baja</span>}
                <span className={`block text-xs font-normal ${p.stock <= p.min_stock ? "text-red-600" : "text-stone-500"}`}>
                  Stock: {p.stock} (mínimo {p.min_stock})
                </span>
              </span>
              <Money value={p.price} className="text-lg font-bold" />
            </summary>
            <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
              <StockAdjust id={p.id} />
              <ProductForm product={p} />
              <ToggleActive table="products" id={p.id} active={!!p.active} />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
