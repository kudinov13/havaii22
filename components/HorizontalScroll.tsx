"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGallery } from "@/lib/siteStore";
import { useImageSrcs } from "@/lib/useImageSrc";

gsap.registerPlugin(ScrollTrigger);

/**
 * Горизонтальная скролл-сцена: секция пинится, контент листается вбок.
 * Главная «вау»-фича. Отключается под reduced-motion (становится обычным скроллом).
 * Фото и подписи редактируются в админке (/admin → Фото сайта).
 */
export function HorizontalScroll() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const items = useGallery();
  const srcs = useImageSrcs(items.map((g) => g.src));

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const getScroll = () => track.scrollWidth - section.clientWidth;
      gsap.to(track, {
        x: () => -getScroll(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getScroll()}`,
          scrub: 0.6,
          pin: true,
          // Явно margin: если секция окажется внутри flex-родителя,
          // ScrollTrigger сам отключил бы pinSpacing и пин перестал бы резервировать место.
          pinSpacing: "margin",
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    // Пин создаёт spacer, который сдвигает все нижестоящие триггеры.
    // Обновляем позиции после того, как пин рассчитан.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => { cancelAnimationFrame(raf); ctx.revert(); };
  }, [items.length]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-ink text-cream" aria-label="Галерея — скролл-сцена">
      {/* Тонкая золотая линия сверху */}
      <div className="gold-rule absolute inset-x-0 top-0 z-10" aria-hidden="true" />

      <div className="flex h-screen items-center">
        <div ref={trackRef} className="flex h-full w-max flex-none items-center gap-6 px-6 sm:gap-10 sm:px-16">
          {/* Интро-панель */}
          <div className="flex h-full shrink-0 flex-col justify-center pr-6 sm:pr-16">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Галерея
            </span>
            <h2 className="mt-4 font-display text-5xl font-medium leading-[1.02] sm:text-6xl lg:text-7xl">
              Кадры
              <br />
              <span className="italic text-gold-soft">на память</span>
            </h2>
            <p className="mt-5 max-w-xs text-base leading-relaxed text-cream/70">
              Листайте вбок — пляж, сапы, баня у воды и закаты,
              ради которых сюда возвращаются.
            </p>
            <span className="mt-8 inline-flex items-center gap-2 text-sm text-cream/50">
              <span className="h-px w-10 bg-cream/30" aria-hidden="true" />
              скролл вниз →
            </span>
          </div>

          {/* Фото-панели */}
          {items.map((g, i) => (
            <figure key={g.id} className="relative shrink-0">
              <div className="frame-passepartout h-[58vh] w-[76vw] !bg-cream/10 sm:h-[62vh] sm:w-[46vw] lg:w-[36vw]">
                <img
                  src={srcs[i] || g.src}
                  alt={g.alt}
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-2xl italic text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm text-cream/70">{g.caption}</span>
              </figcaption>
            </figure>
          ))}

          {/* Финальная панель */}
          <div className="flex h-full shrink-0 flex-col justify-center pl-6 sm:pl-16">
            <p className="font-display text-4xl italic leading-tight text-cream/80 sm:text-5xl">
              Осталось
              <br />
              увидеть
              <br />
              <span className="text-gold">вживую.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
