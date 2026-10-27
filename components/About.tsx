import { FlameKindling, Waves, Car, Fish, Sailboat, Clock } from "lucide-react";
import { Reveal, RevealStagger } from "./Reveal";
import { AboutBg } from "./AboutBg";
import { BASE_INFO } from "@/lib/data";

const FEATURES = [
  { icon: FlameKindling, label: "Баня на дровах" },
  { icon: Waves, label: "Свой пляж и шезлонги" },
  { icon: Sailboat, label: "SUP и катамараны" },
  { icon: Car, label: "Парковка у домика" },
  { icon: Fish, label: "Рыбалка" },
  { icon: Clock, label: "Заезд 24/7, круглый год" },
];

export function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-cream py-24 sm:py-32">
      {/* Параллакс-фон территории (заменяется в админке) */}
      <AboutBg />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              <span className="h-px w-6 bg-gold" aria-hidden="true" />
              О базе
            </span>
            <h2 className="mt-4 font-display text-4xl font-medium leading-[1.02] text-ink sm:text-5xl lg:text-[3.5rem]">
              22 метра от шезлонга
              <br />
              <span className="italic text-emerald-deep">до изумрудной воды</span>
            </h2>
            <div className="mt-7 space-y-4 text-base leading-relaxed text-ink-muted sm:text-lg">
              <p>
                «Гавайи22» — база отдыха на берегу затопленного карьера
                в селе Верх-Катунское, месте, которое называют
                «легендарные 22 карьеры». Вода здесь цвета изумруда,
                а озеро не замерзает круглый год.
              </p>
              <p>
                Три домика с собственными беседками и мангалами работают
                круглый год: зимой — баня у незамерзающей воды, летом —
                пляж, шезлонги, сапы и рыбалка. От шезлонга до воды —
                ровно 22 метра.
              </p>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm text-ink">
                  <f.icon size={20} className="shrink-0 text-emerald" aria-hidden="true" />
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <RevealStagger className="flex flex-col justify-center gap-6 lg:pl-8">
            {BASE_INFO.facts.map((f) => (
              <div key={f.label} className="flex items-baseline gap-5 border-b border-sand-deep/60 pb-5">
                <span className="font-display text-5xl font-medium leading-none text-terracotta sm:text-6xl">
                  {f.value}
                </span>
                <span className="text-sm uppercase tracking-[0.16em] text-ink-muted">{f.label}</span>
              </div>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
