"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { HOUSE_TYPE_LABELS, type House, type HouseType } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { AmenityIcon } from "./AmenityIcon";
import { Reveal } from "./Reveal";
import { openHouse } from "@/lib/events";
import { useHouses } from "@/lib/siteStore";
import { useImageSrc } from "@/lib/useImageSrc";
import { ArrowUpRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: EASE, delay: i * 0.08 },
  }),
};

const STATUS_STYLES: Record<string, string> = {
  free: "bg-emerald text-paper",
  busy: "bg-ink/70 text-cream",
  ondate: "bg-gold text-ink",
};
const STATUS_LABELS: Record<string, string> = {
  free: "Свободен",
  busy: "Занят",
  ondate: "На даты",
};

function HouseCard({ h, i }: { h: House; i: number }) {
  const cover = h.images.find((img) => img.isCover) ?? h.images[0];
  const coverSrc = useImageSrc(cover?.src);

  return (
    <motion.article
      layout
      custom={i}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-8% 0px" }}
      onClick={() => openHouse(h.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openHouse(h.id); } }}
      tabIndex={0}
      role="button"
      aria-label={`Открыть карточку домика ${h.name}`}
      className="group flex cursor-pointer flex-col overflow-hidden bg-paper shadow-[var(--shadow-soft)] transition-shadow duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cream-deep"
      style={{ borderRadius: "var(--radius-card)" }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Фото в паспарту */}
      <div className="frame-passepartout m-4 mb-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-sand">
          {coverSrc && (
            <img
              src={coverSrc}
              alt={cover?.alt ?? h.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
              loading="lazy"
            />
          )}
          <span
            className={cn(
              "absolute left-3 top-3 rounded-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
              STATUS_STYLES[h.status],
            )}
          >
            {STATUS_LABELS[h.status]}
          </span>
        </div>
      </div>

      {/* Контент */}
      <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-medium text-ink">{h.name}</h3>
            <p className="mt-1 text-sm leading-snug text-ink-muted">{h.shortDesc}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-xl font-semibold text-terracotta">{formatPrice(h.pricePerNight)}</p>
            <p className="text-[11px] text-ink-muted">за ночь</p>
          </div>
        </div>

        <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-1">
          {h.amenities.slice(0, 4).map((a) => (
            <li key={a} className="flex items-center gap-1.5 text-xs text-ink-muted">
              <AmenityIcon amenity={a} size={15} className="text-emerald" />
            </li>
          ))}
          {h.amenities.length > 4 && (
            <li className="text-xs text-ink-muted">+{h.amenities.length - 4}</li>
          )}
        </ul>

        <div className="mt-auto flex items-center justify-between border-t border-sand-deep/50 pt-4">
          <span className="text-xs text-ink-muted">
            до {h.guests} гостей{h.area > 0 ? ` · ${h.area} м²` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta transition-transform duration-200 group-hover:translate-x-1">
            Подробнее <ArrowUpRight size={16} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export function Houses() {
  const all = useHouses();
  const [filter, setFilter] = useState<HouseType | "all">("all");

  const types = useMemo(() => [...new Set(all.map((h) => h.type))], [all]);
  const houses = useMemo(
    () => (filter === "all" ? all : all.filter((h) => h.type === filter)),
    [all, filter],
  );

  return (
    <section id="houses" className="relative bg-cream-deep py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
                <span className="h-px w-6 bg-gold" aria-hidden="true" />
                Домики
              </span>
              <h2 className="mt-4 font-display text-4xl font-medium leading-[1.02] text-ink sm:text-5xl lg:text-[3.5rem]">
                Домики
                <br />
                <span className="italic text-emerald-deep">у самой воды</span>
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-ink-muted">
              У каждого — кухня, душ, кондиционер и своя беседка с мангалом
              (уже в стоимости). Работаем круглый год.
            </p>
          </div>
        </Reveal>

        {/* Фильтры — только если есть больше одного типа */}
        {types.length > 1 && (
          <Reveal delay={0.05}>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {[{ value: "all" as const, label: "Все" }, ...types.map((t) => ({ value: t, label: HOUSE_TYPE_LABELS[t] }))].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded-pill px-4 py-2 text-sm font-medium transition-all duration-200",
                    filter === f.value
                      ? "bg-terracotta text-paper shadow-[var(--shadow-gold)]"
                      : "bg-paper text-ink-muted hover:bg-sand hover:text-ink",
                  )}
                  aria-pressed={filter === f.value}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Reveal>
        )}

        {/* Сетка — равные карточки, Framer Motion whileInView (совместимо с layout) */}
        <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {houses.map((h, i) => <HouseCard key={h.id} h={h} i={i} />)}
        </div>
      </div>
    </section>
  );
}
