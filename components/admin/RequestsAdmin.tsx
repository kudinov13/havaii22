"use client";

import { useEffect, useState } from "react";
import { Inbox, Phone, CheckCircle2, Circle, CalendarDays, RefreshCw, Check, X } from "lucide-react";
import {
  markRequestRead, deleteServerRequest, setServerRequestStatus,
  useServerRequests, getReadIds, refreshServerRequests,
} from "@/lib/siteStore";
import { fmtRuRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { iconBtn } from "./ui";

function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function RequestsAdmin() {
  const items = useServerRequests();
  const readIds = getReadIds();
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    await refreshServerRequests();
    setLoading(false);
  }

  useEffect(() => {
    void refreshServerRequests();
  }, []);

  const unread = items.filter((r) => !readIds.has(r.id)).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {items.length === 0
            ? "Заявок пока нет — они появятся здесь, когда гость заполнит форму на сайте."
            : `${items.length} заявок${unread ? ` · ${unread} новых` : ""}`}
        </p>
        <button onClick={reload} className={iconBtn} aria-label="Обновить" title="Обновить">
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-soft border border-dashed border-sand-deep bg-paper/60 py-16 text-center">
          <Inbox size={40} className="text-ink-muted/40" />
          <p className="text-sm text-ink-muted">Пока пусто. Формы: «Заявка на звонок» в футере и «Забронировать» в карточке домика.</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((r) => {
            const read = readIds.has(r.id);
            const confirmed = r.status === "confirmed";
            const declined = r.status === "declined";
            return (
              <li
                key={r.id}
                className={cn(
                  "flex flex-col gap-3 rounded-soft bg-paper p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center",
                  !read && "ring-2 ring-gold/50",
                  confirmed && "ring-2 ring-emerald/50",
                  declined && "opacity-60",
                )}
              >
                <button
                  onClick={() => markRequestRead(r.id, !read)}
                  className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", read ? "text-emerald" : "text-gold hover:bg-sand")}
                  aria-label={read ? "Отметить непрочитанной" : "Отметить прочитанной"}
                  title={read ? "Прочитано" : "Новая"}
                >
                  {read ? <CheckCircle2 size={20} /> : <Circle size={20} />}
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
                  <p className="mt-1 text-xs text-ink-muted/70">
                    {r.source ?? "сайт"} · {fmtDate(r.ts)}{r.tg ? " · 📨 в Telegram" : ""}
                    {confirmed && <span className="ml-1 font-medium text-emerald-deep">· ✅ подтверждена{r.statusBy ? ` (${r.statusBy})` : ""}</span>}
                    {declined && <span className="ml-1 font-medium text-terracotta-deep">· ❌ отклонена{r.statusBy ? ` (${r.statusBy})` : ""}</span>}
                  </p>
                </div>

                <div className="flex shrink-0 flex-row gap-1.5 sm:flex-col">
                  <button
                    onClick={async () => { await setServerRequestStatus(r.id, confirmed ? "" : "confirmed"); }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors",
                      confirmed ? "bg-emerald text-paper" : "bg-emerald/10 text-emerald-deep hover:bg-emerald/20",
                    )}
                  >
                    <Check size={13} /> {confirmed ? "Подтверждена" : "Подтвердить"}
                  </button>
                  <button
                    onClick={async () => { await setServerRequestStatus(r.id, declined ? "" : "declined"); }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors",
                      declined ? "bg-terracotta text-paper" : "bg-terracotta/10 text-terracotta-deep hover:bg-terracotta/20",
                    )}
                  >
                    <X size={13} /> {declined ? "Отклонена" : "Отклонить"}
                  </button>
                  <button
                    onClick={async () => { await deleteServerRequest(r.id); await refreshServerRequests(); }}
                    className="inline-flex items-center gap-1 rounded-pill bg-sand px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-sand-deep"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
