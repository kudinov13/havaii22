"use client";

import { useState } from "react";
import { Phone, MessageCircle, Send, CheckCircle2, KeyRound } from "lucide-react";
import { LogoMark } from "./LogoMark";
import { BASE_INFO } from "@/lib/data";
import { addRequest, useHouses } from "@/lib/siteStore";

const NAV = [
  { href: "#about", label: "О базе" },
  { href: "#houses", label: "Домики" },
  { href: "#services", label: "Услуги" },
  { href: "#map", label: "Территория" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#contacts", label: "Контакты" },
];

export function Footer() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [houseId, setHouseId] = useState("");
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const houses = useHouses();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || phone.trim().length < 6) return;
    const h = houses.find((x) => x.id === houseId);
    addRequest({
      name: name.trim(),
      phone: phone.trim(),
      comment: comment.trim() || undefined,
      houseId: h?.id,
      houseName: h?.name,
      source: "Форма в футере",
    });
    setSent(true);
    setName(""); setPhone(""); setHouseId(""); setComment("");
  }

  return (
    <footer className="relative bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-7 w-auto text-terracotta" />
              <span className="font-display text-2xl font-semibold">Гавайи<span className="text-terracotta">22</span></span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/65">
              База отдыха на легендарных 22 карьерах. Домики у воды, баня на дровах, сапы и закаты. Круглый год.
            </p>
            <div className="mt-5 flex gap-3">
              <a href={BASE_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream/10 transition-colors hover:bg-cream/20" aria-label="WhatsApp">
                <MessageCircle size={20} />
              </a>
              <a href={BASE_INFO.vk} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream/10 transition-colors hover:bg-cream/20" aria-label="Группа VK">
                <Send size={20} />
              </a>
              <a href={`tel:${BASE_INFO.phoneHref}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cream/10 transition-colors hover:bg-cream/20" aria-label="Позвонить">
                <Phone size={20} />
              </a>
            </div>
          </div>

          <nav aria-label="Подвал">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/50">Разделы</h3>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-cream/75 transition-colors hover:text-cream">{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/50">Заявка на звонок</h3>
            {sent ? (
              <div className="mt-4 flex items-center gap-3 rounded-soft bg-cream/10 p-4">
                <CheckCircle2 size={22} className="shrink-0 text-emerald" />
                <p className="text-sm text-cream/85">Спасибо! Перезвоним в ближайшее время.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 flex flex-col gap-2.5" noValidate>
                <input
                  type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)}
                  className="rounded-soft border border-cream/15 bg-cream/5 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-emerald/50"
                  aria-label="Имя" required minLength={2}
                />
                <input
                  type="tel" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="rounded-soft border border-cream/15 bg-cream/5 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-emerald/50"
                  aria-label="Телефон" required minLength={6}
                />
                <select
                  value={houseId} onChange={(e) => setHouseId(e.target.value)}
                  className="rounded-soft border border-cream/15 bg-cream/5 px-3.5 py-2.5 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-emerald/50"
                  aria-label="Домик"
                >
                  <option value="" className="text-ink">Любой домик</option>
                  {houses.map((h) => (
                    <option key={h.id} value={h.id} className="text-ink">{h.name}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Комментарий (необязательно)" value={comment} onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="resize-none rounded-soft border border-cream/15 bg-cream/5 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-emerald/50"
                  aria-label="Комментарий"
                />
                <button type="submit" className="rounded-pill bg-terracotta px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-terracotta-deep">
                  Перезвоните мне
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-cream/10 pt-6 text-sm text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Гавайи22. Все права защищены.</p>
          <p>{BASE_INFO.address}</p>
          <a href="/admin" className="inline-flex items-center gap-1.5 text-xs text-cream/35 transition-colors hover:text-cream/70">
            <KeyRound size={12} />
            Для персонала
          </a>
        </div>
      </div>
    </footer>
  );
}
