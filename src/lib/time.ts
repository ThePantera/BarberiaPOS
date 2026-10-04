// Fechas en hora local de la barbería, guardadas como texto "YYYY-MM-DD HH:mm:ss"
// para poder comparar y agrupar directamente en SQLite.

export const APP_TIMEZONE =
  process.env.APP_TIMEZONE || "America/Argentina/Buenos_Aires";

function parts(date: Date, timeZone = APP_TIMEZONE) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  return out;
}

export function localDateTime(date = new Date()): string {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

export function localDate(date = new Date()): string {
  return localDateTime(date).slice(0, 10);
}

export function localMonth(date = new Date()): string {
  return localDateTime(date).slice(0, 7);
}

/** Días completos entre dos fechas "YYYY-MM-DD..." (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((db - da) / 86_400_000);
}

export function addDays(day: string, n: number): string {
  const d = new Date(
    Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10) + n),
  );
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana de `day`. */
export function startOfWeek(day: string): string {
  const d = new Date(
    Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)),
  );
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lunes
  return addDays(day, -dow);
}

export function endOfMonth(month: string): string {
  const d = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0));
  return d.toISOString().slice(0, 10);
}
