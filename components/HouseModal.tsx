"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, ChevronLeft, ChevronRight, Users, Maximize, Phone, CheckCircle2 } from "lucide-react";
import { BASE_INFO } from "@/lib/data";
import type { House } from "@/lib/types";
import { formatPrice, cn } from "@/lib/utils";
import { OPEN_HOUSE_EVENT } from "@/lib/events";
import { getHouses, addRequest, useServices } from "@/lib/siteStore";
import { eachDayISO, toISO, fmtRuRange, fmtRuDay } from "@/lib/dates";
import { DateCalendar } from "./DateCalendar";
import { useImageSrcs } from "@/lib/useImageSrc";
import { AmenityList } from "./AmenityIcon";

export function HouseModal() {
  const [house, setHouse] = useState<House | null>(null);
  const [active, setActive] = useState(0);
  const [bookOpen, setBookOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [service, setService] = useState("");
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const services = useServices();

  const open = useCallback((id: string) => {
    const h = getHouses().find((x) => x.id === id);
    if (h) { setHouse(h); setActive(0); setBookOpen(false); setSent(false); setName(""); setPhone(""); setCheckIn(""); setCheckOut(""); setService(""); setComment(""); }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { houseId: string };
      if (detail?.houseId) open(detail.houseId);
    };
    window.addEventListener(OPEN_HOUSE_EVENT, handler);
    return () => window.removeEventListener(OPEN_HOUSE_EVENT, handler);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = house ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [house]);

  useEffect(() => {
    if (!house) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHouse(null);
      if (e.key === "ArrowRight") setActive((a) => Math.min(a + 1, house.images.length - 1));
      if (e.key === "ArrowLeft") setActive((a) => Math.max(a - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [house]);

  const srcs = useImageSrcs(house?.images.map((im) => im.src) ?? []);
  const images = house?.images ?? [];
  const blocked = house?.blockedDates ?? [];
  const today = toISO(new Date());
  // Конфликт: выбранные даты пересекаются с занятыми
  const wantDays = checkIn ? eachDayISO(checkIn, checkOut || checkIn) : [];
  const conflictDays = wantDays.filter((d) => blocked.includes(d));

  // Клик по дню календаря: первый — заезд, второй — выезд
  function pickDay(iso: string) {
    if (iso < today) return;
    if (!checkIn || checkOut || iso <= checkIn) { setCheckIn(iso); setCheckOut(""); }
    else setCheckOut(iso);
  }

  function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!house || name.trim().length < 2 || phone.trim().length < 6 || conflictDays.length) return;
    addRequest({
      name: name.trim(),
      phone: phone.trim(),
      comment: comment.trim() || undefined,
      houseId: house.id,
      houseName: house.name,
      service: service || undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || checkIn || undefined,
      source: "Карточка домика",
    });
    setSent(true);
  }

  return (
    <AnimatePresence>
      {house && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setHouse(null)}
          role="dialog" aria-modal="true" aria-label={`Домик ${house.name}`}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden bg-paper sm:rounded-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setHouse(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink/60 text-cream backdrop-blur transition-colors hover:bg-ink"
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>

            <div className="grid gap-0 overflow-y-auto md:grid-cols-[1.25fr_1fr]">
              {/* Галерея */}
              <div className="relative aspect-[4/3] w-full bg-sand md:aspect-auto md:h-full md:min-h-[440px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0.3, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    {srcs[active] && (
                      <img
                        src={srcs[active]} alt={images[active]?.alt ?? house.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActive((a) => Math.max(a - 1, 0))} disabled={active === 0}
                      className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-cream backdrop-blur transition-colors hover:bg-ink disabled:opacity-30"
                      aria-label="Предыдущее фото"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setActive((a) => Math.min(a + 1, images.length - 1))} disabled={active === images.length - 1}
                      className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-cream backdrop-blur transition-colors hover:bg-ink disabled:opacity-30"
                      aria-label="Следующее фото"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="no-scrollbar absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto px-3">
                      {images.map((im, i) => (
                        <button
                          key={im.id} onClick={() => setActive(i)}
                          className={cn(
                            "relative h-12 w-16 shrink-0 overflow-hidden rounded-sm border-2 transition-colors",
                            i === active ? "border-terracotta" : "border-transparent opacity-70 hover:opacity-100",
                          )}
                          aria-label={`Фото ${i + 1}`}
                        >
                          {srcs[i] && <img src={srcs[i]} alt={im.alt} className="h-full w-full object-cover" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Инфо */}
              <div className="flex flex-col gap-5 p-6 sm:p-8">
                <div>
                  <h3 className="font-display text-3xl font-medium text-ink">{house.name}</h3>
                  <p className="mt-2 text-ink-muted">{house.description}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
                  <span className="inline-flex items-center gap-2">
                    <Users size={18} className="text-emerald" /> до {house.guests} гостей
                  </span>
                  {house.area > 0 && (
                    <span className="inline-flex items-center gap-2">
                      <Maximize size={18} className="text-emerald" /> {house.area} м²
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Удобства</h4>
                  <AmenityList amenities={house.amenities} className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5" />
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    Даты заезда — выезда <span className="font-normal normal-case tracking-normal text-ink-muted/70">(зачёркнутые заняты)</span>
                  </h4>
                  <DateCalendar
                    busy={new Set(blocked)}
                    from={checkIn}
                    to={checkOut}
                    onPick={pickDay}
                    className="mt-2 max-w-xs"
                  />
                  {checkIn && (
                    <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-muted">
                      Выбрано: <b className="text-ink">{fmtRuRange(checkIn, checkOut || checkIn)}</b>
                      <button type="button" onClick={() => { setCheckIn(""); setCheckOut(""); }} className="text-terracotta-deep underline underline-offset-2 hover:text-terracotta">
                        сбросить
                      </button>
                    </p>
                  )}
                </div>

                <div className="mt-auto border-t border-sand-deep/60 pt-5">
                  {sent ? (
                    <div className="flex items-center gap-3 rounded-soft bg-emerald/10 p-4">
                      <CheckCircle2 size={22} className="shrink-0 text-emerald" />
                      <p className="text-sm text-ink">Заявка отправлена! Перезвоним в ближайшее время.</p>
                    </div>
                  ) : bookOpen ? (
                    <form onSubmit={submitRequest} className="flex flex-col gap-2.5" noValidate>
                      <p className="text-sm font-semibold text-ink">Оставьте контакты — перезвоним и забронируем</p>
                      <input
                        type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)}
                        className="rounded-soft border border-sand-deep bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50"
                        aria-label="Имя" required minLength={2}
                      />
                      <input
                        type="tel" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="rounded-soft border border-sand-deep bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50"
                        aria-label="Телефон" required minLength={6}
                      />
                      <select
                        value={service} onChange={(e) => setService(e.target.value)}
                        className="rounded-soft border border-sand-deep bg-cream px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/50"
                        aria-label="Дополнительная услуга"
                      >
                        <option value="">Без доп. услуг</option>
                        {services.map((s) => (
                          <option key={s.title} value={s.title}>{s.title}{s.price ? ` — ${s.price}` : ""}</option>
                        ))}
                      </select>
                      <textarea
                        placeholder="Комментарий (необязательно)" value={comment} onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        className="resize-none rounded-soft border border-sand-deep bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50"
                        aria-label="Комментарий к заявке"
                      />
                      {conflictDays.length > 0 && (
                        <p className="text-xs font-medium text-terracotta-deep">
                          {fmtRuDay(conflictDays[0])}{conflictDays.length > 1 ? ` и ещё ${conflictDays.length - 1} дн.` : ""} уже занято — выберите другие даты.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button type="submit" disabled={conflictDays.length > 0} className="flex-1 rounded-pill bg-terracotta px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-terracotta-deep disabled:opacity-50">
                          Отправить заявку
                        </button>
                        <button type="button" onClick={() => setBookOpen(false)} className="rounded-pill border border-sand-deep px-4 py-2.5 text-sm text-ink-muted hover:bg-sand">
                          Назад
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-display text-2xl font-semibold text-terracotta">{formatPrice(house.pricePerNight)}</p>
                        <p className="text-xs text-ink-muted">за ночь</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => setBookOpen(true)}
                          className="rounded-pill bg-terracotta px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-terracotta-deep"
                        >
                          Забронировать
                        </button>
                        <a
                          href={`tel:${BASE_INFO.phoneHref}`}
                          className="inline-flex items-center justify-center gap-2 rounded-pill border border-sand-deep px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-sand"
                        >
                          <Phone size={15} /> Позвонить
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
