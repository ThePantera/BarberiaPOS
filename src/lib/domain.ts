// Reglas de negocio puras (sin base de datos) para poder testearlas aisladas.

export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta";
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
];

export function isPaymentMethod(v: unknown): v is PaymentMethod {
  return v === "efectivo" || v === "transferencia" || v === "tarjeta";
}

// ---------- Fidelización ----------

export type LoyaltyRule = {
  id: number;
  name: string;
  visits_required: number;
  discount_pct: number;
  active: number;
};

/**
 * Devuelve la regla que aplica a la visita número `visitNumber` del mes
 * (1 = primera visita del mes). Una regla "3 visitas = 20%" aplica en la
 * 3.ª visita del mes. Si varias coinciden, gana la de mayor descuento.
 */
export function pickLoyaltyRule(
  rules: LoyaltyRule[],
  visitNumber: number,
): LoyaltyRule | null {
  let best: LoyaltyRule | null = null;
  for (const r of rules) {
    if (!r.active || r.visits_required !== visitNumber) continue;
    if (!best || r.discount_pct > best.discount_pct) best = r;
  }
  return best;
}

// ---------- Cálculo del ticket ----------

export type SaleInput = {
  servicePrice: number;
  products: { unitPrice: number; qty: number }[];
  discountPct: number; // se aplica solo al servicio
  barberCommissionPct: number;
  serviceFixedCommission: number | null; // tasa fija por servicio, pisa al %
};

export type SaleTotals = {
  serviceGross: number;
  discountAmount: number;
  serviceNet: number;
  productsTotal: number;
  total: number;
  commission: number;
};

export function computeSale(input: SaleInput): SaleTotals {
  const serviceGross = Math.max(0, Math.round(input.servicePrice));
  const pct = Math.min(100, Math.max(0, input.discountPct));
  const discountAmount = Math.round((serviceGross * pct) / 100);
  const serviceNet = serviceGross - discountAmount;
  const productsTotal = input.products.reduce(
    (acc, p) => acc + Math.round(p.unitPrice) * Math.max(0, p.qty),
    0,
  );
  const commission =
    input.serviceFixedCommission != null
      ? Math.round(input.serviceFixedCommission)
      : Math.round((serviceNet * input.barberCommissionPct) / 100);
  return {
    serviceGross,
    discountAmount,
    serviceNet,
    productsTotal,
    total: serviceNet + productsTotal,
    commission,
  };
}

// ---------- Segmentación ----------

export type Segment = "fiel" | "regular" | "riesgo" | "otro";

export const SEGMENTS: { value: Segment; label: string; hint: string }[] = [
  { value: "fiel", label: "Clientes fieles", hint: "2 o más visitas este mes" },
  {
    value: "regular",
    label: "En frecuencia regular",
    hint: "15 a 25 días desde la última visita",
  },
  {
    value: "riesgo",
    label: "Inactivos / En riesgo",
    hint: "Más de 30 días sin visitas",
  },
];

export function segmentFor(
  visitsThisMonth: number,
  daysSinceLastVisit: number | null,
): Segment {
  if (visitsThisMonth >= 2) return "fiel";
  if (daysSinceLastVisit == null) return "otro";
  if (daysSinceLastVisit > 30) return "riesgo";
  if (daysSinceLastVisit >= 15 && daysSinceLastVisit <= 25) return "regular";
  return "otro";
}

// ---------- WhatsApp ----------

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Arma el número internacional para wa.me. `prefix` es el prefijo del país
 * para celulares (Argentina: 549). Si el número ya lo trae, no se duplica.
 */
export function whatsappNumber(phone: string, prefix: string): string {
  let d = digitsOnly(phone);
  const p = digitsOnly(prefix);
  if (!p || d.startsWith(p)) return d;
  const country = p.slice(0, 2);
  if (d.startsWith(country) && d.length > 10) d = d.slice(country.length);
  d = d.replace(/^0/, "");
  return p + d;
}

export function fillTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (m, k) =>
    k in vars ? String(vars[k]) : m,
  );
}

export function whatsappLink(phone: string, prefix: string, text: string) {
  return `https://wa.me/${whatsappNumber(phone, prefix)}?text=${encodeURIComponent(text)}`;
}

// ---------- Caja ----------

export function expectedCash(openingCash: number, cashSales: number): number {
  return openingCash + cashSales;
}

export function formatMoney(n: number): string {
  const v = Math.round(n);
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString("es-AR");
}
