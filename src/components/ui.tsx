import { formatMoney } from "@/lib/domain";
import type { Segment } from "@/lib/domain";

export function Money({ value, className }: { value: number; className?: string }) {
  return <span className={`tabular-nums ${className ?? ""}`}>{formatMoney(value)}</span>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

const SEGMENT_STYLE: Record<Segment, [string, string]> = {
  fiel: ["Fiel", "bg-emerald-100 text-emerald-800"],
  regular: ["Frecuencia regular", "bg-sky-100 text-sky-800"],
  riesgo: ["En riesgo", "bg-red-100 text-red-700"],
  otro: ["Sin segmento", "bg-stone-100 text-stone-600"],
};

export function SegmentChip({ segment }: { segment: Segment }) {
  const [label, cls] = SEGMENT_STYLE[segment];
  return <span className={`chip ${cls}`}>{label}</span>;
}

export const PAYMENT_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export function formatDateTime(s: string) {
  const [d, t] = s.split(" ");
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y.slice(2)} ${t?.slice(0, 5) ?? ""}`.trim();
}

export function formatDate(s: string) {
  const [y, m, day] = s.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}
