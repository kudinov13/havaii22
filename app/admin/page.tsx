"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Anchor, ClipboardList, Home, Images, LogOut, RotateCcw, KeyRound, ExternalLink, CalendarOff, BadgePercent, Menu, X } from "lucide-react";
import { RequestsAdmin } from "@/components/admin/RequestsAdmin";
import { HousesAdmin } from "@/components/admin/HousesAdmin";
import { PhotosAdmin } from "@/components/admin/PhotosAdmin";
import { ServicesAdmin } from "@/components/admin/ServicesAdmin";
import { BookingsAdmin } from "@/components/admin/BookingsAdmin";
import { resetOverrides, useServerRequests, getReadIds, setAdminCode, verifyAdminCode, refreshServerRequests } from "@/lib/siteStore";
import { cn } from "@/lib/utils";
import { inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";

// Код проверяется на сервере (/api/admin.php); локальный — фолбэк для dev.
const ADMIN_CODE = "Gv22!Katun#Bereg";
const AUTH_KEY = "g22_admin_auth";
const AUTH_EVENT = "g22-auth-change";

// true на клиенте после монтирования, false при SSR — без setState в эффекте
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useAuthed(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(AUTH_EVENT, cb);
      return () => window.removeEventListener(AUTH_EVENT, cb);
    },
    () => localStorage.getItem(AUTH_KEY) === "1",
    () => false,
  );
}

type Tab = "requests" | "bookings" | "houses" | "services" | "photos";

const TABS: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
  { id: "requests", label: "Заявки", icon: ClipboardList },
  { id: "bookings", label: "Занятость", icon: CalendarOff },
  { id: "houses", label: "Домики", icon: Home },
  { id: "services", label: "Услуги", icon: BadgePercent },
  { id: "photos", label: "Фото сайта", icon: Images },
];

export default function AdminPage() {
  const mounted = useMounted();
  const authed = useAuthed();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("requests");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const requests = useServerRequests();
  const readIds = getReadIds();
  const unread = requests.filter((r) => !readIds.has(r.id)).length;

  useEffect(() => {
    if (authed) void refreshServerRequests();
  }, [authed]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const ok = await verifyAdminCode(code);
    // null = сервер недоступен (dev/offline) — сверяем с локальным кодом
    if (ok === true || (ok === null && code === ADMIN_CODE)) {
      setAdminCode(code);
      localStorage.setItem(AUTH_KEY, "1");
      window.dispatchEvent(new CustomEvent(AUTH_EVENT));
      void refreshServerRequests();
    } else {
      setError(true);
    }
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }

  if (!mounted) return <div className="min-h-screen bg-cream" />;

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-5">
        <form onSubmit={login} className="w-full max-w-sm rounded-soft bg-paper p-8 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2.5">
            <Anchor size={24} className="text-terracotta" />
            <span className="font-display text-xl font-semibold text-ink">Гавайи<span className="text-terracotta">22</span></span>
          </div>
          <h1 className="mt-6 font-display text-2xl font-medium text-ink">Вход в админку</h1>
          <p className="mt-1 text-sm text-ink-muted">Введите код доступа.</p>
          <div className="relative mt-5">
            <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted/60" />
            <input
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(false); }}
              placeholder="Код доступа"
              className={cn(inputCls, "pl-10", error && "border-terracotta ring-2 ring-terracotta/30")}
              autoFocus
            />
          </div>
          {error && <p className="mt-2 text-xs font-medium text-terracotta-deep">Неверный код</p>}
          <button type="submit" className={cn(btnPrimary, "mt-5 w-full")}>Войти</button>
          <Link href="/" className="mt-4 block text-center text-xs text-ink-muted hover:text-ink">← На сайт</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-sand-deep/50 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Anchor size={20} className="text-terracotta" />
            <span className="font-display text-lg font-semibold text-ink">Админка</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Разделы админки">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors",
                  tab === t.id ? "bg-ink text-cream" : "text-ink-muted hover:bg-sand hover:text-ink",
                )}
                aria-pressed={tab === t.id}
              >
                <t.icon size={15} />
                {t.label}
                {t.id === "requests" && unread > 0 && (
                  <span className="rounded-full bg-terracotta px-1.5 text-[10px] font-bold text-paper">{unread}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-1 md:flex">
            <Link href="/" target="_blank" className="inline-flex h-8 items-center gap-1 rounded-pill px-2.5 text-xs text-ink-muted hover:bg-sand hover:text-ink" title="Открыть сайт">
              <ExternalLink size={14} /> Сайт
            </Link>
            <button onClick={() => setConfirmReset(true)} className="inline-flex h-8 items-center gap-1 rounded-pill px-2.5 text-xs text-ink-muted hover:bg-sand hover:text-ink" title="Сбросить все правки">
              <RotateCcw size={14} /> Сброс
            </button>
            <button onClick={logout} className="inline-flex h-8 items-center gap-1 rounded-pill px-2.5 text-xs text-ink-muted hover:bg-sand hover:text-ink" title="Выйти">
              <LogOut size={14} /> Выход
            </button>
          </div>

          {/* бургер — только мобила */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-sand md:hidden"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* мобильное меню */}
        {menuOpen && (
          <nav className="border-t border-sand-deep/50 bg-cream px-4 pb-4 pt-2 md:hidden" aria-label="Разделы админки">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setMenuOpen(false); }}
                className={cn(
                  "mt-1 flex w-full items-center gap-3 rounded-soft px-3 py-2.5 text-sm font-medium transition-colors",
                  tab === t.id ? "bg-ink text-cream" : "text-ink hover:bg-sand",
                )}
                aria-pressed={tab === t.id}
              >
                <t.icon size={17} className={tab === t.id ? "text-cream" : "text-ink-muted"} />
                {t.label}
                {t.id === "requests" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-bold text-paper">{unread}</span>
                )}
              </button>
            ))}
            <div className="mt-3 flex gap-2 border-t border-sand-deep/50 pt-3">
              <Link href="/" target="_blank" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-sand-deep px-3 py-2 text-xs font-medium text-ink hover:bg-sand">
                <ExternalLink size={14} /> Сайт
              </Link>
              <button onClick={() => { setConfirmReset(true); setMenuOpen(false); }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-sand-deep px-3 py-2 text-xs font-medium text-ink hover:bg-sand">
                <RotateCcw size={14} /> Сброс
              </button>
              <button onClick={logout} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-sand-deep px-3 py-2 text-xs font-medium text-ink hover:bg-sand">
                <LogOut size={14} /> Выход
              </button>
            </div>
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        {tab === "requests" && <RequestsAdmin />}
        {tab === "bookings" && <BookingsAdmin />}
        {tab === "houses" && <HousesAdmin />}
        {tab === "services" && <ServicesAdmin />}
        {tab === "photos" && <PhotosAdmin />}
      </div>

      {confirmReset && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 p-5 backdrop-blur-sm" onClick={() => setConfirmReset(false)}>
          <div className="w-full max-w-sm rounded-soft bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-medium text-ink">Сбросить все правки?</h3>
            <p className="mt-2 text-sm text-ink-muted">Домики, галерея и фоны вернутся к исходным данным сайта. Заявки сохранятся.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmReset(false)} className={btnGhost}>Отмена</button>
              <button onClick={() => { resetOverrides(); setConfirmReset(false); }} className={btnPrimary}>Сбросить</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
