// Работа с датами брони: ISO "YYYY-MM-DD", локальное время (без UTC-сдвигов).

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Все дни диапазона включительно. Если from > to — пусто. */
export function eachDayISO(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Склеивает отсортированный список дат в непрерывные диапазоны [from, to]. */
export function toDateRanges(dates: string[]): [string, string][] {
  const sorted = [...new Set(dates)].sort();
  const out: [string, string][] = [];
  for (const d of sorted) {
    const last = out[out.length - 1];
    if (last && addDays(last[1], 1) === d) last[1] = d;
    else out.push([d, d]);
  }
  return out;
}

export function fmtRuDay(iso: string): string {
  return parseISO(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function fmtRuRange(from: string, to: string): string {
  return from === to ? fmtRuDay(from) : `${fmtRuDay(from)} — ${fmtRuDay(to)}`;
}
