"use client";

import { useState } from "react";
import { CalendarDays, CalendarOff, ChevronDown, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import type { House } from "@/lib/types";
import { saveHouses, useHouses } from "@/lib/siteStore";
import { eachDayISO, fmtRuRange, parseISO, toDateRanges, toISO } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { AdminImage, btnPrimary } from "./ui";

const DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/** Месяц занятости: серые — занято/прошло, белые — свободно, терракота — выбор. */
function MonthGrid({
  busy,
  from,
  to,
  onDay,
}: {
  busy: Set<string>;
  from: string;
  to: string;
  onDay: (iso: string) => void;
}) {
  const today = toISO(new Date());
  const init = parseISO(from || today);
  const [cur, setCur] = useState({ y: init.getFullYear(), m: init.getMonth() });
  const first = new Date(cur.y, cur.m, 1);
  const lead = (first.getDay() + 6) % 7; // неделя с понедельника
  const start = new Date(cur.y, cur.m, 1 - lead);
  const cells = Array.from({ length: 42 }, (_, i) => toISO(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
  const ym = `${cur.y}-${String(cur.m + 1).padStart(2, "0")}`;
  const label = first.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const shift = (n: number) => {
    const d = new Date(cur.y, cur.m + n, 1);
    setCur({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div className="rounded-soft border border-sand-deep bg-paper p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} className="rounded-full p-1 text-ink-muted hover:bg-sand" aria-label="Предыдущий месяц">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold capitalize text-ink">{label}</span>
        <button type="button" onClick={() => shift(1)} className="rounded-full p-1 text-ink-muted hover:bg-sand" aria-label="Следующий месяц">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((d) => (
          <span key={d} className="pb-1 text-[10px] font-semibold uppercase text-ink-muted/70">{d}</span>
        ))}
        {cells.map((iso) => {
          if (!iso.startsWith(ym)) return <span key={iso} />;
          const past = iso < today;
          const isBusy = busy.has(iso);
          const edge = iso === from || iso === to;
          const mid = !past && !isBusy && from !== "" && to !== "" && iso > from && iso < to;
          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              onClick={() => onDay(iso)}
              title={isBusy ? "Занято — клик освобождает день" : past ? "День прошёл" : undefined}
              className={cn(
                "flex h-8 items-center justify-center rounded-soft text-xs transition-colors",
                past && "cursor-default bg-stone-100 text-stone-300",
                edge && "bg-terracotta font-semibold text-paper",
                !past && !edge && isBusy && "bg-stone-300/70 text-stone-500 line-through hover:bg-stone-300",
                !past && !edge && !isBusy && mid && "bg-terracotta/15 text-terracotta-deep",
                !past && !edge && !isBusy && !mid && "bg-white text-ink hover:bg-terracotta/15",
                iso === today && !edge && "ring-1 ring-inset ring-gold",
              )}
            >
              {parseISO(iso).getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Вкладка «Занятость»: у каждого домика — занятые даты, чтобы не забронировать дважды. */
export function BookingsAdmin() {
  const houses = useHouses();
  const [range, setRange] = useState<Record<string, { from: string; to: string }>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const today = toISO(new Date());

  function save(house: House, blockedDates: string[]) {
    saveHouses(houses.map((h) => (h.id === house.id ? { ...h, blockedDates } : h)));
  }

  // Клик по дню: занятый → освобождаем; свободный → выбираем диапазон (начало/конец)
  function pick(house: House, iso: string) {
    if (iso < today) return;
    const cur = house.blockedDates ?? [];
    if (cur.includes(iso)) {
      save(house, cur.filter((d) => d !== iso));
      return;
    }
    const r = range[house.id] ?? { from: "", to: "" };
    const next = !r.from || (r.from && r.to) || iso <= r.from ? { from: iso, to: "" } : { ...r, to: iso };
    setRange((s) => ({ ...s, [house.id]: next }));
  }

  function addRange(house: House) {
    const r = range[house.id];
    if (!r?.from) return;
    const days = eachDayISO(r.from, r.to || r.from);
    if (!days.length) return;
    const merged = [...new Set([...(house.blockedDates ?? []), ...days])].sort();
    save(house, merged);
    setRange((s) => ({ ...s, [house.id]: { from: "", to: "" } }));
  }

  function removeRange(house: House, from: string, to: string) {
    const del = new Set(eachDayISO(from, to));
    save(house, (house.blockedDates ?? []).filter((d) => !del.has(d)));
  }

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Отметьте занятые даты — гость не сможет отправить заявку на них в карточке домика, а сам домик покажет «занято».
      </p>

      <ul className="mt-5 space-y-4">
        {houses.map((h) => {
          const cover = h.images.find((im) => im.isCover) ?? h.images[0];
          const ranges = toDateRanges(h.blockedDates ?? []);
          const r = range[h.id] ?? { from: "", to: "" };
          const selDays = r.from ? eachDayISO(r.from, r.to || r.from).length : 0;
          const isOpen = !!open[h.id];
          return (
            <li key={h.id} className="rounded-soft bg-paper p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-4">
                <AdminImage src={cover?.src ?? ""} alt={h.name} className="h-14 w-20 shrink-0 rounded-soft" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{h.name}</p>
                  <p className="text-xs text-ink-muted">
                    {ranges.length ? `Занято: ${ranges.length} период${ranges.length === 1 ? "" : "а"}` : "Все даты свободны"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen((s) => ({ ...s, [h.id]: !isOpen }))}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors",
                    isOpen ? "border-terracotta/40 bg-terracotta/10 text-terracotta-deep" : "border-sand-deep text-ink hover:bg-sand",
                  )}
                >
                  <CalendarDays size={13} /> Календарь
                  <ChevronDown size={13} className={cn("transition-transform", isOpen && "rotate-180")} />
                </button>
              </div>

              {ranges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ranges.map(([from, to]) => (
                    <span key={`${from}_${to}`} className="inline-flex items-center gap-1.5 rounded-pill bg-terracotta/10 px-3 py-1 text-xs font-medium text-terracotta-deep">
                      <CalendarOff size={12} />
                      {fmtRuRange(from, to)}
                      <button
                        onClick={() => removeRange(h, from, to)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-terracotta/20"
                        aria-label={`Убрать занятость ${fmtRuRange(from, to)}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {isOpen && (
                <div className="mt-3 max-w-sm">
                  <MonthGrid busy={new Set(h.blockedDates ?? [])} from={r.from} to={r.to} onDay={(iso) => pick(h, iso)} />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-ink-muted">
                      {r.from ? `Выбрано: ${fmtRuRange(r.from, r.to || r.from)} · ${selDays} дн.` : "Клик — начало, второй клик — конец"}
                    </p>
                    <button type="button" onClick={() => addRange(h)} disabled={!r.from} className={cn(btnPrimary, "shrink-0 disabled:opacity-40")}>
                      <Plus size={14} /> Занять
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-ink-muted/70">
                    Серые дни — занято или уже прошли. Клик по занятому дню освобождает его.
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {houses.length === 0 && (
        <p className="mt-6 text-sm text-ink-muted">Сначала добавьте домик на вкладке «Домики».</p>
      )}
    </div>
  );
}
