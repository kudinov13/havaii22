// Клиентское хранилище сайта: переопределения данных админкой (localStorage)
// + заявки из форм. Дефолт — lib/data.ts; правки сохраняются поверх.
// Фото хранятся в IndexedDB (lib/imgdb.ts), в данных — ссылки "idb:<key>".

import { useSyncExternalStore } from "react";
import type { House, GalleryItem, Service } from "./types";
import { HOUSES, GALLERY_ITEMS, SERVICES } from "./data";

const OVERRIDES_KEY = "g22_overrides";
const REQUESTS_KEY = "g22_requests";
const EVENT = "g22-store-change";

export interface SiteOverrides {
  houses?: House[];
  gallery?: GalleryItem[];
  services?: Service[];
  aboutBg?: string;
}

export interface Request {
  id: string;
  name: string;
  phone: string;
  comment?: string;
  /** Выбранный домик (id + имя — для бота и админки) */
  houseId?: string;
  houseName?: string;
  /** Доп. услуга к брони (напр. «Баня на дровах») */
  service?: string;
  /** Даты брони "YYYY-MM-DD" (если заявка из карточки домика) */
  checkIn?: string;
  checkOut?: string;
  source: string;
  createdAt: number;
  read: boolean;
}

// Кэш, чтобы getSnapshot для useSyncExternalStore возвращал стабильные ссылки
const cache = new Map<string, { raw: string | null; val: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const c = cache.get(key);
  if (c && c.raw === raw) return c.val as T;
  let val: unknown = fallback;
  if (raw) {
    try {
      val = JSON.parse(raw);
    } catch {
      val = fallback;
    }
  }
  cache.set(key, { raw, val });
  return val as T;
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/* ---------- Подписка на изменения (вкл. кросс-вкладку) ---------- */

export function subscribeStore(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === OVERRIDES_KEY || e.key === REQUESTS_KEY) callback();
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/* ---------- Переопределения контента ---------- */

export function getOverrides(): SiteOverrides {
  return read<SiteOverrides>(OVERRIDES_KEY, {});
}

export function saveOverrides(patch: Partial<SiteOverrides>): void {
  write(OVERRIDES_KEY, { ...getOverrides(), ...patch });
}

export function getHouses(): House[] {
  return getOverrides().houses ?? HOUSES;
}

export function saveHouses(houses: House[]): void {
  saveOverrides({ houses });
}

export function getGallery(): GalleryItem[] {
  return getOverrides().gallery ?? GALLERY_ITEMS;
}

export function saveGallery(gallery: GalleryItem[]): void {
  saveOverrides({ gallery });
}

export function getServices(): Service[] {
  return getOverrides().services ?? SERVICES;
}

export function saveServices(services: Service[]): void {
  saveOverrides({ services });
}

export const DEFAULT_ABOUT_BG = "/gallery/gal-aero.jpg";

export function getAboutBg(): string {
  return getOverrides().aboutBg ?? DEFAULT_ABOUT_BG;
}

export function saveAboutBg(src: string): void {
  saveOverrides({ aboutBg: src });
}

export function resetOverrides(): void {
  localStorage.removeItem(OVERRIDES_KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
}

/* ---------- React-хуки (useSyncExternalStore) ---------- */

const NO_REQUESTS: Request[] = [];

export function useHouses(): House[] {
  return useSyncExternalStore(subscribeStore, getHouses, () => HOUSES);
}

export function useGallery(): GalleryItem[] {
  return useSyncExternalStore(subscribeStore, getGallery, () => GALLERY_ITEMS);
}

export function useServices(): Service[] {
  return useSyncExternalStore(subscribeStore, getServices, () => SERVICES);
}

export function useAboutBg(): string {
  return useSyncExternalStore(subscribeStore, getAboutBg, () => DEFAULT_ABOUT_BG);
}

export function useRequests(): Request[] {
  return useSyncExternalStore(subscribeStore, getRequests, () => NO_REQUESTS);
}

/* ---------- Заявки ---------- */

export function getRequests(): Request[] {
  return read<Request[]>(REQUESTS_KEY, []);
}

export function addRequest(input: Omit<Request, "id" | "createdAt" | "read">): void {
  const req: Request = {
    ...input,
    id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    read: false,
  };
  write(REQUESTS_KEY, [req, ...getRequests()]);
}

export function markRequestRead(id: string, read: boolean): void {
  write(REQUESTS_KEY, getRequests().map((r) => (r.id === id ? { ...r, read } : r)));
}

export function deleteRequest(id: string): void {
  write(REQUESTS_KEY, getRequests().filter((r) => r.id !== id));
}
