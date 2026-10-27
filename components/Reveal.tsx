"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scroll reveal: малый y, читается как fade. Уважает reduced-motion. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { gsap.set(el, { opacity: 1, y: 0 }); return; }

    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { opacity: 0, y },
        {
          opacity: 1, y: 0, duration: 0.4, delay, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 98%", toggleActions: "play none none reverse" },
        },
      );
    });
    return () => ctx.revert();
  }, [delay, y]);

  return <div ref={ref} className={className}>{children}</div>;
}

/** Stagger-контейнер: дочерние элементы входят с задержкой. */
export function RevealStagger({
  children,
  className,
  stagger = 0.08,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(el.children,
        { opacity: 0, y },
        {
          opacity: 1, y: 0, duration: 0.55, ease: "expo.out", stagger,
          scrollTrigger: { trigger: el, start: "top 98%", toggleActions: "play none none reverse" },
        },
      );
    });
    return () => ctx.revert();
  }, [stagger, y]);

  return <div ref={ref} className={className}>{children}</div>;
}

/** Параллакс-слой (только декоративный). scrub по скроллу. */
export function Parallax({
  children,
  speed = -12,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: speed, ease: "none",
        scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    });
    return () => ctx.revert();
  }, [speed]);

  return <div ref={ref} className={className}>{children}</div>;
}
