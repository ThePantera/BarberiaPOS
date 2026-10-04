"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  clientCardAction,
  createClientAction,
  previewSaleAction,
  registerSaleAction,
  searchClientsAction,
} from "@/app/actions";
import { formatMoney, PAYMENT_METHODS, type PaymentMethod } from "@/lib/domain";
import type { Barber, ClientWithStats, Product, SaleRow, Service } from "@/lib/repo";
import { formatDateTime, SegmentChip } from "@/components/ui";

type Preview = Awaited<ReturnType<typeof previewSaleAction>>;
type Card = { client: ClientWithStats; history: SaleRow[] };

export function Pos({
  barbers,
  services,
  products,
}: {
  barbers: Barber[];
  services: Service[];
  products: Product[];
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [card, setCard] = useState<Card | null>(null);
  const [creating, setCreating] = useState(false);

  const [barberId, setBarberId] = useState<number | null>(
    barbers.length === 1 ? barbers[0].id : null,
  );
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Búsqueda con pequeño debounce; solo se muestran resultados de la consulta actual
  const trimmed = query.trim();
  const [found, setFound] = useState<{ q: string; list: ClientWithStats[] } | null>(null);
  useEffect(() => {
    if (card || trimmed.length < 3) return;
    const t = setTimeout(async () => {
      const list = await searchClientsAction(trimmed);
      setFound({ q: trimmed, list });
    }, 200);
    return () => clearTimeout(t);
  }, [trimmed, card]);
  const results = !card && found && found.q === trimmed ? found.list : null;

  const items = Object.entries(qty)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ productId: Number(id), qty: n }));

  // Recalcula el ticket (precio, fidelidad, comisión) en el servidor
  const previewKey =
    card && barberId && serviceId
      ? JSON.stringify({ clientId: card.client.id, barberId, serviceId, items })
      : null;
  const [previewState, setPreviewState] = useState<{ key: string; data: Preview } | null>(null);
  useEffect(() => {
    if (!previewKey) return;
    let cancelled = false;
    previewSaleAction(JSON.parse(previewKey)).then(
      (data) => !cancelled && setPreviewState({ key: previewKey, data }),
    );
    return () => {
      cancelled = true;
    };
  }, [previewKey]);
  const preview = previewState && previewState.key === previewKey ? previewState.data : null;

  const selectClient = useCallback(async (id: number) => {
    const c = await clientCardAction(id);
    if (c) {
      setCard(c);
      setCreating(false);
      setDone(null);
    }
  }, []);

  const reset = () => {
    setCard(null);
    setQuery("");
    setServiceId(null);
    setQty({});
    setPayment(null);
    setError(null);
    setCreating(false);
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  const confirm = () => {
    if (!card || !barberId || !serviceId || !payment) return;
    setError(null);
    startTransition(async () => {
      const r = await registerSaleAction({
        clientId: card.client.id,
        barberId,
        serviceId,
        items,
        paymentMethod: payment,
      });
      if ("error" in r) {
        setError(r.error ?? "No se pudo registrar el cobro.");
        return;
      }
      const name = card.client.first_name;
      reset();
      setDone(
        `Cobro de ${formatMoney(r.total)} registrado para ${name} (visita ${r.visitNumber} del mes${r.discount ? `, descuento ${formatMoney(r.discount)}` : ""}).`,
      );
    });
  };

  const totals = preview && !("error" in preview) ? preview.totals : null;
  const rule = preview && !("error" in preview) ? preview.rule : null;
  const previewError = preview && "error" in preview ? preview.error : null;
  const canConfirm = !!(card && barberId && serviceId && payment && totals) && !pending;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {done && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            ✓ {done}
          </div>
        )}

        {/* 1. Cliente */}
        <section className="card">
          <StepTitle n={1} title="Cliente" />
          {card ? (
            <ClientCard card={card} onChange={reset} />
          ) : (
            <>
              <input
                ref={searchRef}
                className="input text-lg"
                inputMode="numeric"
                placeholder="DNI o teléfono"
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCreating(false);
                }}
                onKeyDown={async (e) => {
                  if (e.key !== "Enter" || trimmed.length < 3) return;
                  // Si se apretó Enter antes de que llegue la búsqueda, buscar ya
                  const list = results ?? (await searchClientsAction(trimmed));
                  setFound({ q: trimmed, list });
                  if (list.length === 1) selectClient(list[0].id);
                  if (list.length === 0) setCreating(true);
                }}
              />
              {results && results.length > 0 && (
                <ul className="mt-2 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
                  {results.map((c) => (
                    <li key={c.id}>
                      <button
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-stone-50"
                        onClick={() => selectClient(c.id)}
                      >
                        <span>
                          <span className="font-semibold">
                            {c.first_name} {c.last_name}
                          </span>
                          <span className="block text-xs text-stone-500">
                            {c.dni ? `DNI ${c.dni} · ` : ""}
                            {c.phone}
                          </span>
                        </span>
                        <span className="text-right text-xs text-stone-500">
                          {c.visits_month} visitas este mes
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {results && results.length === 0 && !creating && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-brand-50 px-3 py-2.5 text-sm">
                  <span>No hay clientes con ese dato.</span>
                  <button className="btn btn-brand btn-sm" onClick={() => setCreating(true)}>
                    + Registro exprés
                  </button>
                </div>
              )}
              {creating && (
                <ExpressSignup
                  seed={query}
                  onCancel={() => setCreating(false)}
                  onCreated={(id) => selectClient(id)}
                />
              )}
            </>
          )}
        </section>

        {/* 2. Barbero y servicio */}
        <section className={`card ${card ? "" : "pointer-events-none opacity-50"}`}>
          <StepTitle n={2} title="Barbero y servicio" />
          <div className="mb-4 flex flex-wrap gap-2">
            {barbers.map((b) => (
              <Pick key={b.id} active={barberId === b.id} onClick={() => setBarberId(b.id)}>
                {b.name}
              </Pick>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {services.map((s) => (
              <Pick key={s.id} active={serviceId === s.id} onClick={() => setServiceId(s.id)} block>
                <span className="block font-semibold">{s.name}</span>
                <span className="block text-sm opacity-70">{formatMoney(s.price)}</span>
              </Pick>
            ))}
          </div>
        </section>

        {/* 3. Productos */}
        {products.length > 0 && (
          <section className={`card ${card ? "" : "pointer-events-none opacity-50"}`}>
            <StepTitle n={3} title="Productos (opcional)" />
            <ul className="divide-y divide-stone-100">
              {products.map((p) => {
                const n = qty[p.id] ?? 0;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-stone-500">
                        {formatMoney(p.price)} · stock {p.stock}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-sm w-9"
                        disabled={n === 0}
                        onClick={() => setQty({ ...qty, [p.id]: n - 1 })}
                        aria-label={`Quitar ${p.name}`}
                      >
                        −
                      </button>
                      <span className="w-5 text-center tabular-nums">{n}</span>
                      <button
                        className="btn btn-sm w-9"
                        disabled={n >= p.stock}
                        onClick={() => setQty({ ...qty, [p.id]: n + 1 })}
                        aria-label={`Agregar ${p.name}`}
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {/* Ticket */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <section className="card space-y-4">
          <StepTitle n={products.length > 0 ? 4 : 3} title="Cobro" />
          {rule && (
            <div className="rounded-xl border border-brand-500 bg-brand-50 px-3 py-2.5 text-sm">
              <div className="font-bold text-brand-700">🎉 ¡Beneficio de fidelidad!</div>
              <div>
                {rule.name}: <b>{rule.discount_pct}% de descuento</b> en el servicio, aplicado
                automáticamente.
              </div>
            </div>
          )}
          {preview && !("error" in preview) && !rule && (
            <p className="text-xs text-stone-500">
              Esta es la visita n.º {preview.visitNumber} del mes del cliente.
            </p>
          )}
          <dl className="space-y-1.5 text-sm">
            <Row label="Servicio" value={totals?.serviceGross} />
            {!!totals?.discountAmount && (
              <Row label="Descuento" value={-totals.discountAmount} className="text-brand-700" />
            )}
            {!!totals?.productsTotal && <Row label="Productos" value={totals.productsTotal} />}
            <div className="flex items-baseline justify-between border-t border-stone-200 pt-2">
              <dt className="font-semibold">Total</dt>
              <dd className="text-3xl font-bold tabular-nums">
                {totals ? formatMoney(totals.total) : "—"}
              </dd>
            </div>
          </dl>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <Pick
                key={m.value}
                active={payment === m.value}
                onClick={() => setPayment(m.value)}
                block
                small
              >
                {m.label}
              </Pick>
            ))}
          </div>
          {(error || previewError) && (
            <p className="text-sm font-medium text-red-600">{error || previewError}</p>
          )}
          <button className="btn btn-primary w-full py-3.5 text-base" disabled={!canConfirm} onClick={confirm}>
            {pending ? "Registrando…" : totals ? `Confirmar cobro ${formatMoney(totals.total)}` : "Confirmar cobro"}
          </button>
          {card && (
            <button className="w-full text-center text-xs text-stone-500 underline" onClick={reset}>
              Cancelar
            </button>
          )}
        </section>
      </aside>
    </div>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wide text-stone-500 uppercase">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white">{n}</span>
      {title}
    </h2>
  );
}

function Pick({
  active,
  onClick,
  children,
  block,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  block?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border-2 text-left transition ${small ? "px-2 py-2 text-center text-sm" : "px-4 py-2.5"} ${
        block ? "w-full" : ""
      } ${active ? "border-brand-500 bg-brand-50 font-semibold" : "border-stone-200 bg-white hover:border-stone-300"}`}
    >
      {children}
    </button>
  );
}

function Row({ label, value, className }: { label: string; value?: number; className?: string }) {
  return (
    <div className={`flex justify-between ${className ?? ""}`}>
      <dt className="text-stone-500">{label}</dt>
      <dd className="tabular-nums">{value == null ? "—" : formatMoney(value)}</dd>
    </div>
  );
}

function ClientCard({ card, onChange }: { card: Card; onChange: () => void }) {
  const c = card.client;
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/clientes/${c.id}`} className="text-xl font-bold hover:underline">
            {c.first_name} {c.last_name}
          </Link>
          <div className="text-sm text-stone-500">
            {c.dni ? `DNI ${c.dni} · ` : ""}
            {c.phone}
          </div>
        </div>
        <button className="btn btn-sm" onClick={onChange}>
          Cambiar
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="Visitas del mes" value={String(c.visits_month)} highlight />
        <Stat label="Visitas totales" value={String(c.visits_total)} />
        <Stat label="Total gastado" value={formatMoney(c.total_spent)} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
        <SegmentChip segment={c.segment} />
        {c.last_visit ? `Última visita ${formatDateTime(c.last_visit)}` : "Primera visita"}
      </div>
      {card.history.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-stone-600">
          {card.history.map((h) => (
            <li key={h.id} className="flex justify-between gap-2">
              <span>
                {formatDateTime(h.created_at)} · {h.service_name} con {h.barber_name}
              </span>
              <span className="tabular-nums">{formatMoney(h.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-2 py-2 ${highlight ? "bg-brand-50" : "bg-stone-50"}`}>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-stone-500">{label}</div>
    </div>
  );
}

function ExpressSignup({
  seed,
  onCancel,
  onCreated,
}: {
  seed: string;
  onCancel: () => void;
  onCreated: (id: number) => void;
}) {
  const digits = seed.replace(/\D/g, "");
  // 7-8 dígitos suele ser un DNI; más largo, un teléfono
  const looksLikeDni = digits.length >= 7 && digits.length <= 8;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-3 grid gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3 sm:grid-cols-2"
      action={(fd) =>
        startTransition(async () => {
          const r = await createClientAction({
            dni: String(fd.get("dni") ?? ""),
            first_name: String(fd.get("first_name") ?? ""),
            last_name: String(fd.get("last_name") ?? ""),
            phone: String(fd.get("phone") ?? ""),
          });
          if ("error" in r) setError(r.error ?? "Error");
          else onCreated(r.id);
        })
      }
    >
      <div className="sm:col-span-2 text-sm font-bold">Registro exprés</div>
      <div>
        <label className="label">Nombre</label>
        <input name="first_name" className="input" required autoFocus />
      </div>
      <div>
        <label className="label">Apellido</label>
        <input name="last_name" className="input" required />
      </div>
      <div>
        <label className="label">Teléfono</label>
        <input
          name="phone"
          className="input"
          inputMode="tel"
          required
          defaultValue={looksLikeDni ? "" : digits}
        />
      </div>
      <div>
        <label className="label">DNI (opcional)</label>
        <input name="dni" className="input" inputMode="numeric" defaultValue={looksLikeDni ? digits : ""} />
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Guardando…" : "Registrar y continuar"}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
