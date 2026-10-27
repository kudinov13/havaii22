import { Star } from "lucide-react";
import { REVIEWS } from "@/lib/data";
import { Reveal, RevealStagger } from "./Reveal";

export function Reviews() {
  return (
    <section id="reviews" className="relative bg-cream-deep py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            Отзывы
          </span>
          <h2 className="mt-4 font-display text-4xl font-medium leading-[1.02] text-ink sm:text-5xl lg:text-[3.5rem]">
            Гости говорят
            <br />
            <span className="italic text-emerald-deep">лучше нас</span>
          </h2>
        </Reveal>

        <RevealStagger className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {REVIEWS.map((r) => (
            <figure
              key={r.name}
              className="flex flex-col gap-4 rounded-soft bg-paper p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex gap-0.5" aria-label={`Оценка ${r.rating} из 5`}>
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} size={15} className="fill-gold text-gold" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-ink">
                «{r.text}»
              </blockquote>
              <figcaption className="mt-auto border-t border-sand-deep/50 pt-3">
                <p className="text-sm font-semibold text-ink">{r.name}</p>
                <p className="text-xs text-ink-muted">{r.date}</p>
              </figcaption>
            </figure>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
