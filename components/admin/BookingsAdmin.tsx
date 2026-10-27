"use client";

import { useState } from "react";
import { CalendarOff, Plus, X } from "lucide-react";
import type { House } from "@/lib/types";
import { saveHouses, useHouses } from "@/lib/siteStore";
import { eachDayISO, toDateRanges, fmtRuRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { AdminImage, Field, inputCls, btnPrimary } from "./ui";

/** Вкладка «Занятость»: у каждого домика — занятые даты, чтобы не забронировать дважды. */
export function BookingsAdmin() {
  const houses = useHouses();
  const [range, setRange] = useState<Record<string, { from: string; to: string }>>({});

  function save(house: House, blockedDates: string[]) {
    saveHouses(houses.map((h) => (h.id === house.id ? { ...h, blockedDates } : h)));
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

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Field label="Занято с">
                  <input
                    type="date"
                    className={cn(inputCls, "w-40")}
                    value={r.from}
                    onChange={(e) => setRange((s) => ({ ...s, [h.id]: { ...r, from: e.target.value } }))}
                  />
                </Field>
                <Field label="по">
                  <input
                    type="date"
                    className={cn(inputCls, "w-40")}
                    min={r.from}
                    value={r.to}
                    onChange={(e) => setRange((s) => ({ ...s, [h.id]: { ...r, to: e.target.value } }))}
                  />
                </Field>
                <button onClick={() => addRange(h)} disabled={!r.from} className={cn(btnPrimary, "disabled:opacity-40")}>
                  <Plus size={15} /> Занять
                </button>
              </div>
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
