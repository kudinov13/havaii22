"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Home, Waves, Coffee } from "lucide-react";
import { MAP_POINTS } from "@/lib/data";
import type { MapPoint } from "@/lib/types";
import { openHouse } from "@/lib/events";
import { Reveal } from "./Reveal";

const TYPE_COLORS: Record<MapPoint["type"], string> = {
  house: "#c96f4a",
  facility: "#d9a441",
  water: "#2a9d8f",
};

const TYPE_ICONS: Record<MapPoint["type"], typeof Home> = {
  house: Home,
  facility: Coffee,
  water: Waves,
};

export function TerritoryMap() {
  const [active, setActive] = useState<MapPoint | null>(null);

  const handleClick = (p: MapPoint) => {
    if (p.type === "house" && p.houseId) {
      openHouse(p.houseId);
      return;
    }
    setActive(active?.id === p.id ? null : p);
  };

  return (
    <section id="map" className="relative bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            Территория
          </span>
          <h2 className="mt-4 font-display text-4xl font-medium leading-[1.02] text-ink sm:text-5xl lg:text-[3.5rem]">
            Мини-карта
            <br />
            <span className="italic text-emerald-deep">территории</span>
          </h2>
          <p className="mt-4 max-w-md text-base text-ink-muted">
            Как в 2ГИС: слева — вода карьера и песчаный пляж, затем парковка и дорога; справа — домики со своими беседками и мангалом. Кликните по домику — откроется карточка.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-10 rounded-soft bg-paper p-4 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="relative">
              {/* SVG-карта: вода слева → песчаная полоса с домиками → дорога → парковка → зона «Гаваии» справа */}
              <svg viewBox="0 0 100 90" className="w-full rounded-soft" role="img" aria-label="Схема территории базы Гавайи22">
                <defs>
                  <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f2e8d5" />
                    <stop offset="100%" stopColor="#e8dcc4" />
                  </linearGradient>
                  <linearGradient id="waterG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3ab0a0" />
                    <stop offset="100%" stopColor="#1d7268" />
                  </linearGradient>
                  <linearGradient id="sandG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ecd9b0" />
                    <stop offset="100%" stopColor="#e0c896" />
                  </linearGradient>
                  <linearGradient id="gavaiZone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d8e8c8" />
                    <stop offset="100%" stopColor="#c2d6a8" />
                  </linearGradient>
                </defs>

                {/* Земля (вся) */}
                <rect width="100" height="90" rx="2" fill="url(#land)" />

                {/* Зелень: север (за домиками) и юг */}
                <path d="M62,0 L100,0 L100,20 C92,18 84,16 78,10 C72,5 66,2 62,0 Z" fill="url(#gavaiZone)" opacity="0.85" />
                <path d="M58,90 L100,90 L100,74 C92,76 84,78 76,82 C68,85 62,88 58,90 Z" fill="url(#gavaiZone)" opacity="0.85" />

                {/* Карьер — вода слева (береговая линия ~ x=33) */}
                <path
                  d="M0,0 L34,0 C32,10 37,18 34,28 C31,38 37,48 33,58 C29,68 35,78 34,90 L0,90 Z"
                  fill="url(#waterG)"
                />
                {/* Блики на воде */}
                <ellipse cx="12" cy="26" rx="8" ry="1.1" fill="#f0e6c8" opacity="0.32" />
                <ellipse cx="20" cy="48" rx="10" ry="1.3" fill="#f0e6c8" opacity="0.24" />
                <ellipse cx="9" cy="68" rx="6" ry="0.9" fill="#f0e6c8" opacity="0.18" />
                <text x="13" y="10" fontSize="2.1" fill="#c96a3a" fontWeight="700" opacity="0.85" letterSpacing="0.2">22 карьеры</text>

                {/* Песчаный пляж — полоса вдоль берега (x ~ 36–48) */}
                <path
                  d="M36,18 C35,30 37,42 36,54 C35,64 37,70 37,76 L48,74 C48,60 47,38 48,20 Z"
                  fill="url(#sandG)"
                />
                {/* Пляжные зонтики — 5 шт в ряд вдоль воды */}
                {[26, 36, 46, 56, 66].map((y, i) => (
                  <g key={`u-${i}`} transform={`translate(42, ${y})`}>
                    <path d="M-1.5,0 A1.5,1.5 0 0 1 1.5,0 Z" fill="#c96f4a" opacity="0.85" />
                    <line x1="0" y1="0" x2="0" y2="1.8" stroke="#8a6a3a" strokeWidth="0.28" />
                  </g>
                ))}
                <text x="42" y="74" textAnchor="middle" fontSize="2" fill="#8a6a3a" fontWeight="600" opacity="0.7" letterSpacing="0.3">ПЛЯЖ</text>

                {/* Парковка — серая полоса между пляжем и дорогой */}
                <rect x="50" y="30" width="6" height="30" rx="0.8" fill="#c8bfae" />
                <text x="53" y="46" textAnchor="middle" fontSize="2.6" fill="#7a705f" fontWeight="700">P</text>

                {/* Дорога: с юга на север, наверху поворачивает к «22 карьерам» */}
                <path d="M61,90 L61,20 C61,12 54,10 48,7 C42,4 38,2 35,0" stroke="#c9b890" strokeWidth="4.6" fill="none" />
                <path d="M61,88 L61,20 C61,12 54,10 48,7 C42,4 38,2 35,1" stroke="#fffdf8" strokeWidth="0.4" strokeDasharray="2 2" fill="none" opacity="0.85" />

                {/* Зона «Гавайи22» — справа от дороги */}
                <text x="84" y="14" textAnchor="middle" fontSize="2.4" fill="#3a5a2a" fontWeight="700" letterSpacing="0.3">ГАВАЙИ 22</text>

                {/* Беседки/мангалы — деревянные пристройки рядом с каждым домиком */}
                {[28, 43, 58].map((y, i) => (
                  <g key={`g-${i}`}>
                    <rect x="80.5" y={y - 1.2} width="4.4" height="2.4" rx="0.4" fill="#b98a55" stroke="#fffdf8" strokeWidth="0.18" />
                  </g>
                ))}

                {/* Деревья */}
                {[
                  [70, 8], [92, 10], [97, 18],
                  [68, 74], [76, 80], [90, 78], [97, 84],
                  [88, 6], [52, 84],
                ].map(([x, y], i) => (
                  <g key={`t-${i}`} opacity="0.75">
                    <polygon points={`${x},${y - 2.2} ${x - 1.4},${y} ${x + 1.4},${y}`} fill="#2e7d52" />
                    <polygon points={`${x},${y - 1.2} ${x - 1.6},${y + 0.8} ${x + 1.6},${y + 0.8}`} fill="#27684a" />
                  </g>
                ))}

                {/* Туалеты — север и юг */}
                {[10, 80].map((y, i) => (
                  <g key={`wc-${i}`}>
                    <rect x="70" y={y - 1} width="2.2" height="2" rx="0.3" fill="#8f8577" stroke="#fffdf8" strokeWidth="0.15" />
                    <text x="71.1" y={y + 0.55} textAnchor="middle" fontSize="0.9" fill="#fffdf8" fontWeight="700">WC</text>
                  </g>
                ))}

                {/* Точки-метки */}
                {MAP_POINTS.map((p) => {
                  const isActive = active?.id === p.id;
                  const isHouse = p.type === "house";
                  const num = p.id.replace("p", "");
                  return (
                    <g
                      key={p.id}
                      onClick={() => handleClick(p)}
                      onMouseEnter={() => setActive(p)}
                      onMouseLeave={() => setActive(null)}
                      style={{ cursor: isHouse ? "pointer" : "help" }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${p.label}. ${p.description}`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(p); } }}
                    >
                      {isHouse ? (
                        <>
                          {/* Пульс-ореол под домиком */}
                          <circle
                            cx={p.x}
                            cy={p.y + 0.4}
                            r="2.6"
                            fill={TYPE_COLORS[p.type]}
                            opacity={isActive ? 0.4 : 0.18}
                          >
                            <animate attributeName="r" values="2.6;3.4;2.6" dur="2.4s" repeatCount="indefinite" />
                          </circle>
                          {/* Иконка домика: крыша + корпус + дверь */}
                          <g transform={`translate(${p.x - 1.6}, ${p.y - 1.5})`}>
                            {/* Крыша */}
                            <polygon
                              points="1.6,0 0,1.4 3.2,1.4"
                              fill={isActive ? "#a8563a" : "#c96f4a"}
                              stroke="#fffdf8"
                              strokeWidth="0.18"
                              strokeLinejoin="round"
                            />
                            {/* Корпус */}
                            <rect
                              x="0.3" y="1.4" width="2.6" height="2"
                              fill={isActive ? "#c96f4a" : "#d97a52"}
                              stroke="#fffdf8"
                              strokeWidth="0.18"
                            />
                            {/* Дверь */}
                            <rect
                              x="1.3" y="2.3" width="0.6" height="1.1"
                              fill="#fffdf8"
                              opacity="0.85"
                            />
                            {/* Номер на крыше */}
                            <text
                              x="1.6"
                              y="1.1"
                              textAnchor="middle"
                              fontSize="0.85"
                              fill="#fffdf8"
                              fontWeight="700"
                              pointerEvents="none"
                            >
                              {num}
                            </text>
                          </g>
                        </>
                      ) : (
                        <>
                          {/* Пульс-ареол для не-домиков */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="2.4"
                            fill={TYPE_COLORS[p.type]}
                            opacity={isActive ? 0.4 : 0.18}
                          />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="1.4"
                            fill={TYPE_COLORS[p.type]}
                            stroke="#fffdf8"
                            strokeWidth="0.4"
                          />
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Тултип */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="pointer-events-none absolute z-10 rounded-soft bg-ink px-3.5 py-2.5 text-cream shadow-[var(--shadow-lift)]"
                    style={{
                      left: `${active.x}%`,
                      top: `${(active.y / 90) * 100}%`,
                      transform:
                        active.type === "house"
                          ? "translate(-50%, calc(-100% - 18px))"
                          : "translate(-50%, calc(-100% - 10px))",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {(() => { const Icon = TYPE_ICONS[active.type]; return <Icon size={14} className="text-gold" />; })()}
                      <span className="whitespace-nowrap text-xs font-semibold">{active.label}</span>
                    </div>
                    <p className="mt-0.5 whitespace-nowrap text-[11px] text-cream/70">{active.description}</p>
                    {active.type === "house" && (
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gold">Открыть карточку →</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Легенда */}
            <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-sand-deep/50 pt-4">
              {(
                [
                  { type: "house" as const, label: "Домики (кликабельны)" },
                  { type: "facility" as const, label: "Инфраструктура" },
                  { type: "water" as const, label: "Вода / пляж" },
                ]
              ).map((l) => (
                <span key={l.type} className="inline-flex items-center gap-2 text-xs text-ink-muted">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: TYPE_COLORS[l.type] }}
                    aria-hidden="true"
                  />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
