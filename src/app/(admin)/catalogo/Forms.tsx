"use client";

import { adjustStockAction, saveProductAction, saveServiceAction } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";
import type { Product, Service } from "@/lib/repo";

export function ServiceForm({ service }: { service?: Service }) {
  return (
    <ActionForm
      action={saveServiceAction}
      className="grid items-end gap-2 sm:grid-cols-[1fr_130px_150px_auto]"
      resetOnSuccess={!service}
    >
      {service && <input type="hidden" name="id" value={service.id} />}
      <div>
        <label className="label">Servicio</label>
        <input name="name" className="input" defaultValue={service?.name} required />
      </div>
      <div>
        <label className="label">Precio</label>
        <input name="price" className="input" inputMode="decimal" defaultValue={service?.price} required />
      </div>
      <div>
        <label className="label" title="Si se completa, reemplaza el % del barbero">
          Comisión fija $
        </label>
        <input
          name="fixed_commission"
          className="input"
          inputMode="decimal"
          placeholder="Usa % del barbero"
          defaultValue={service?.fixed_commission ?? ""}
        />
      </div>
      <button className="btn btn-primary">{service ? "Guardar" : "Agregar"}</button>
    </ActionForm>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  return (
    <ActionForm
      action={saveProductAction}
      className="grid items-end gap-2 sm:grid-cols-[1fr_120px_100px_100px_auto]"
      resetOnSuccess={!product}
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <div>
        <label className="label">Producto</label>
        <input name="name" className="input" defaultValue={product?.name} required />
      </div>
      <div>
        <label className="label">Precio</label>
        <input name="price" className="input" inputMode="decimal" defaultValue={product?.price} required />
      </div>
      <div>
        <label className="label">Stock</label>
        <input name="stock" className="input" inputMode="numeric" defaultValue={product?.stock ?? 0} />
      </div>
      <div>
        <label className="label">Mínimo</label>
        <input name="min_stock" className="input" inputMode="numeric" defaultValue={product?.min_stock ?? 0} />
      </div>
      <button className="btn btn-primary">{product ? "Guardar" : "Agregar"}</button>
    </ActionForm>
  );
}

export function StockAdjust({ id }: { id: number }) {
  return (
    <ActionForm action={adjustStockAction} className="flex flex-wrap items-end gap-2" resetOnSuccess>
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="label">Ingreso / ajuste de stock</label>
        <input name="delta" className="input w-36" inputMode="numeric" placeholder="+10 o -2" required />
      </div>
      <button className="btn">Aplicar</button>
    </ActionForm>
  );
}
