"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { LogoMark } from "./LogoMark";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#about", label: "О базе" },
  { href: "#houses", label: "Домики" },
  { href: "#services", label: "Услуги" },
  { href: "#map", label: "Территория" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#contacts", label: "Контакты" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "glass-warm shadow-[var(--shadow-soft)]" : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-20">
        <a href="#top" className={cn("group flex items-center gap-2.5 transition-colors", scrolled ? "text-ink" : "text-cream")} aria-label="Гавайи22 — на главную">
          <LogoMark className="h-6 w-auto text-terracotta transition-transform duration-300 group-hover:-translate-y-0.5" />
          <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Гавайи<span className="text-terracotta">22</span>
          </span>
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  scrolled ? "text-ink-muted hover:text-ink" : "text-cream/85 hover:text-cream",
                )}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contacts"
          className={cn(
            "hidden rounded-pill px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] lg:inline-flex",
            scrolled
              ? "border border-terracotta text-terracotta hover:bg-terracotta hover:text-paper"
              : "border border-cream/60 text-cream hover:bg-cream hover:text-ink",
          )}
        >
          Связаться
        </a>

        <button
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden",
            scrolled ? "text-ink hover:bg-sand/60" : "text-cream hover:bg-cream/15",
          )}
          aria-label="Открыть меню"
        >
          <Menu size={24} />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-cream lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-5">
              <span className="font-display text-xl font-semibold text-ink">Гавайи<span className="text-terracotta">22</span></span>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-sand/60"
                aria-label="Закрыть меню"
              >
                <X size={24} />
              </button>
            </div>
            <motion.ul
              className="flex flex-col gap-1 px-5 pt-8"
              initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
            >
              {NAV_LINKS.map((l) => (
                <motion.li key={l.href} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
                  <a
                    href={l.href} onClick={() => setOpen(false)}
                    className="block min-h-[48px] py-3 font-display text-4xl font-medium text-ink transition-colors hover:text-terracotta"
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}
              <motion.li variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="pt-6">
                <a
                  href="#contacts" onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-pill bg-terracotta px-6 py-3.5 text-base font-semibold text-paper transition-colors hover:bg-terracotta-deep"
                >
                  Связаться с нами
                </a>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
