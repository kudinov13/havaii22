"use client";

import { motion } from "motion/react";
import { ArrowDown, MapPin } from "lucide-react";
import { BASE_INFO } from "@/lib/data";

export function Hero() {
  return (
    <section id="top" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* Фон — реальное фото */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src="/hero/Hero.jpg"
          alt=""
          className="ken-burns h-full w-full object-cover"
        />
      </div>

      {/* Затемнение для читаемости текста: левая часть темнее, низ плавно уходит в ink */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(43,38,34,0.35) 0%, rgba(43,38,34,0.15) 35%, rgba(43,38,34,0.65) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, rgba(43,38,34,0.55) 0%, rgba(43,38,34,0.2) 45%, transparent 75%)",
        }}
        aria-hidden="true"
      />

      {/* Контент — асимметрия: внизу слева, смещение */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-20 sm:px-8 lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="max-w-3xl"
        >
          <motion.span
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cream/90"
          >
            <span className="h-px w-8 bg-gold" aria-hidden="true" />
            {BASE_INFO.tagline}
          </motion.span>

          <h1 className="mt-5 font-display text-6xl font-medium leading-[0.98] tracking-tight text-cream sm:text-7xl lg:text-[6.5rem]">
            Гавайи<span className="text-gold-soft">22</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/85 sm:text-xl">
            Домики у самой воды на легендарных 22 карьерах. Свой пляж,
            баня на дровах, сапы и закаты. 22 км от Бийска — и вы у воды.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#houses"
              className="inline-flex items-center justify-center rounded-pill bg-terracotta px-8 py-3.5 text-base font-semibold text-paper shadow-[var(--shadow-gold)] transition-all duration-200 hover:bg-terracotta-deep active:scale-[0.97]"
            >
              Смотреть домики
            </a>
            <a
              href="#contacts"
              className="inline-flex items-center justify-center gap-2 rounded-pill border border-cream/40 px-6 py-3.5 text-base font-medium text-cream transition-colors duration-200 hover:bg-cream/10"
            >
              <MapPin size={18} aria-hidden="true" />
              Как добраться
            </a>
          </div>
        </motion.div>
      </div>

      {/* Скролл-индикатор */}
      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-cream/70 sm:flex"
        aria-label="Прокрутить вниз"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">Листайте</span>
        <motion.span animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown size={18} />
        </motion.span>
      </motion.a>
    </section>
  );
}
