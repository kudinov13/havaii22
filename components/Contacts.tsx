import { Phone, MessageCircle, Send, MapPin, Clock, Navigation, Mail } from "lucide-react";
import { BASE_INFO } from "@/lib/data";
import { Reveal } from "./Reveal";

export function Contacts() {
  return (
    <section id="contacts" className="relative bg-cream-deep py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            Контакты
          </span>
          <h2 className="mt-4 font-display text-4xl font-medium leading-[1.02] text-ink sm:text-5xl lg:text-[3.5rem]">
            Как добраться
            <br />
            <span className="italic text-emerald-deep">и как забронировать</span>
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Reveal className="flex flex-col gap-5">
            <div className="rounded-soft bg-paper p-6 shadow-[var(--shadow-soft)]">
              <h3 className="font-display text-xl font-medium text-ink">Адрес</h3>
              <p className="mt-2 flex items-start gap-2.5 text-ink-muted">
                <MapPin size={20} className="mt-0.5 shrink-0 text-terracotta" />
                {BASE_INFO.address}
              </p>
              <p className="mt-2 flex items-start gap-2.5 text-sm text-ink-muted">
                <Navigation size={18} className="mt-0.5 shrink-0 text-emerald" />
                Локация «Легендарные 22 карьеры», ~22 км от Бийска
              </p>
            </div>

            <div className="rounded-soft bg-paper p-6 shadow-[var(--shadow-soft)]">
              <h3 className="font-display text-xl font-medium text-ink">Режим работы</h3>
              <ul className="mt-3 space-y-2 text-ink-muted">
                <li className="flex items-center gap-2.5">
                  <Clock size={18} className="text-emerald" /> {BASE_INFO.workHours}
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock size={18} className="text-emerald" /> Время заезда и выезда — уточняйте при бронировании
                </li>
              </ul>
            </div>

            <div className="rounded-soft bg-ink p-6 text-cream shadow-[var(--shadow-soft)]">
              <h3 className="font-display text-xl font-medium">Связаться</h3>
              <p className="mt-2 text-cream/75">Бронирование по телефону или в сообщениях группы VK.</p>
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <a
                  href={`tel:${BASE_INFO.phoneHref}`}
                  className="inline-flex items-center justify-center gap-2 rounded-pill bg-terracotta px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-terracotta-deep"
                >
                  <Phone size={16} /> {BASE_INFO.phone}
                </a>
                <a
                  href={BASE_INFO.whatsapp} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-pill border border-cream/25 px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-cream/10"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a
                  href={BASE_INFO.vk} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-pill border border-cream/25 px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-cream/10"
                >
                  <Send size={16} /> Группа VK
                </a>
              </div>
              <a
                href={`mailto:${BASE_INFO.email}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-cream/60 transition-colors hover:text-cream"
              >
                <Mail size={15} /> {BASE_INFO.email}
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="overflow-hidden rounded-soft shadow-[var(--shadow-soft)]">
            <iframe
              title="Карта — как добраться до базы Гавайи22"
              src="https://yandex.ru/map-widget/v1/?ll=85.521491%2C52.426704&z=15&pt=85.521491,52.426704,pm2rdm"
              className="h-full min-h-[360px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
