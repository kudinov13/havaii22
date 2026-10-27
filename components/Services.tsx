"use client";

import { useServices } from "@/lib/siteStore";
import { ServiceIcon_ } from "./AmenityIcon";
import { Reveal, RevealStagger } from "./Reveal";

export function Services() {
  const services = useServices();
  return (
    <section id="services" className="relative bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
                <span className="h-px w-6 bg-gold" aria-hidden="true" />
                Услуги
              </span>
              <h2 className="mt-4 font-display text-4xl font-medium leading-[1.02] text-ink sm:text-5xl lg:text-[3.5rem]">
                Больше, чем
                <br />
                <span className="italic text-emerald-deep">просто ночёвка</span>
              </h2>
            </div>
            <p className="max-w-sm text-base leading-relaxed text-ink-muted">
              Баня на дровах у самой воды, сапы, катамараны и своя
              мангальная зона у каждого домика.
            </p>
          </div>
        </Reveal>

        <RevealStagger className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className="group flex flex-col gap-4 rounded-soft bg-paper p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10 text-emerald transition-colors duration-300 group-hover:bg-emerald group-hover:text-paper">
                <ServiceIcon_ icon={s.icon} size={22} />
              </div>
              <div>
                <h3 className="font-display text-xl font-medium text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.description}</p>
              </div>
              <span className="mt-auto text-sm font-semibold text-terracotta">{s.price}</span>
            </div>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
