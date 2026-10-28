"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO, toISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/**
 * Месяц для выбора диапазона дат: занятые и прошедшие дни серые и не кликаются,
 * свободные белые, выбранный диапазон — терракота.
 */
export function DateCalendar({
  busy,
  from,
  to,
  onPick,
  className,
}: {
  /** ISO-даты, которые заняты — рисуются зачёркнутыми */
  busy: Set<string>;
  from: string;
  to: string;
  onPick: (iso: string) => void;
  className?: string;
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
    <div className={cn("rounded-soft border border-sand-deep bg-paper p-3", className)}>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} className="rounded-full p-1 text-ink-muted transition-colors hover:bg-sand" aria-label="Предыдущий месяц">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold capitalize text-ink">{label}</span>
        <button type="button" onClick={() => shift(1)} className="rounded-full p-1 text-ink-muted transition-colors hover:bg-sand" aria-label="Следующий месяц">
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
              disabled={past || isBusy}
              onClick={() => onPick(iso)}
              title={isBusy ? "Занято" : past ? "День прошёл" : undefined}
              className={cn(
                "flex h-8 items-center justify-center rounded-soft text-xs transition-colors",
                (past || isBusy) && "cursor-default bg-stone-200/70 text-stone-400 line-through",
                !past && !isBusy && "bg-white text-ink hover:bg-terracotta/15",
                mid && "bg-terracotta/15 text-terracotta-deep",
                edge && "bg-terracotta font-semibold text-paper",
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
