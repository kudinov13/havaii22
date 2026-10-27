"use client";

import { Inbox, Trash2, Phone, CheckCircle2, Circle, CalendarDays } from "lucide-react";
import { markRequestRead, deleteRequest, useRequests } from "@/lib/siteStore";
import { fmtRuRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { iconBtn } from "./ui";

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function RequestsAdmin() {
  const items = useRequests();

  const unread = items.filter((r) => !r.read).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {items.length === 0
            ? "Заявок пока нет — они появятся здесь, когда гость заполнит форму на сайте."
            : `${items.length} заявок${unread ? ` · ${unread} новых` : ""}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-soft border border-dashed border-sand-deep bg-paper/60 py-16 text-center">
          <Inbox size={40} className="text-ink-muted/40" />
          <p className="text-sm text-ink-muted">Пока пусто. Формы: «Заявка на звонок» в футере и «Забронировать» в карточке домика.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex flex-col gap-3 rounded-soft bg-paper p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center",
                !r.read && "ring-2 ring-gold/50",
              )}
            >
              <button
                onClick={() => markRequestRead(r.id, !r.read)}
                className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", r.read ? "text-emerald" : "text-gold hover:bg-sand")}
                aria-label={r.read ? "Отметить непрочитанной" : "Отметить прочитанной"}
                title={r.read ? "Прочитано" : "Новая"}
              >
                {r.read ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold text-ink">{r.name}</span>
                  <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1 text-sm font-medium text-terracotta hover:underline">
                    <Phone size={13} /> {r.phone}
                  </a>
                </div>
                {r.comment && <p className="mt-1 text-sm text-ink-muted">{r.comment}</p>}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {r.houseName && (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-terracotta/10 px-2.5 py-0.5 text-xs font-medium text-terracotta-deep">
                      {r.houseName}
                    </span>
                  )}
                  {r.service && (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-gold/20 px-2.5 py-0.5 text-xs font-medium text-ink">
                      + {r.service}
                    </span>
                  )}
                </div>
                {r.checkIn && (
                  <p className="mt-1 inline-flex items-center gap-1.5 rounded-pill bg-emerald/10 px-2.5 py-0.5 text-xs font-medium text-emerald-deep">
                    <CalendarDays size={12} /> {fmtRuRange(r.checkIn, r.checkOut ?? r.checkIn)}
                  </p>
                )}
                <p className="mt-1 text-xs text-ink-muted/70">{r.source} · {fmtDate(r.createdAt)}</p>
              </div>

              <button onClick={() => deleteRequest(r.id)} className={iconBtn} aria-label="Удалить заявку" title="Удалить">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
