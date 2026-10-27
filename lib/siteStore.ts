// Клиентское хранилище сайта.
// Источник данных — сервер (/api/data.php → ~/data/site-data.json на хостинге):
// домики, услуги, галерея, занятые даты общие для всех устройств и бота.
// localStorage остаётся офлайн-кэшем/черновиком, если API недоступен (dev-режим).
// Заявки: формы POST-ят в /api/request.php (→ Telegram) + админка читает
// серверный лог через /api/admin.php.

import { useSyncExternalStore } from "react";
import type { House, GalleryItem, Service } from "./types";
import { HOUSES, GALLERY_ITEMS, SERVICES } from "./data";

const OVERRIDES_KEY = "g22_overrides"; // локальный кэш/черновик
const READ_IDS_KEY = "g22_read_ids";   // прочитанные заявки (локально)
const ADMIN_CODE_KEY = "g22_admin_code";
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
  houseId?: string;
  houseName?: string;
  service?: string;
  checkIn?: string;
  checkOut?: string;
  source: string;
  createdAt: number;
  read: boolean;
}

// Серверные данные — основной источник правды после загрузки
let serverData: SiteOverrides | null = null;
let serverBooted = false;

function notify(): void {
  window.dispatchEvent(new CustomEvent(EVENT));
}

function bootstrapServer(): void {
  if (serverBooted || typeof window === "undefined") return;
  serverBooted = true;
  fetch("/api/data.php")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.ok && d.data) {
        serverData = d.data;
        notify();
      }
    })
    .catch(() => {});
}

/* ---------- Локальный кэш (fallback / офлайн) ---------- */

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
  notify();
}

/* ---------- Подписка ---------- */

export function subscribeStore(callback: () => void): () => void {
  bootstrapServer();
  const onStorage = (e: StorageEvent) => {
    if (e.key === OVERRIDES_KEY || e.key === READ_IDS_KEY) callback();
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/* ---------- Админ-код и сохранение на сервер ---------- */

export function getAdminCode(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(ADMIN_CODE_KEY) ?? "";
}

export function setAdminCode(code: string): void {
  sessionStorage.setItem(ADMIN_CODE_KEY, code);
}

/** Проверка кода на сервере. true = ок, false = неверный, null = сервер недоступен (dev). */
export async function verifyAdminCode(code: string): Promise<boolean | null> {
  try {
    const r = await fetch("/api/admin.php?action=ping", { headers: { "X-Admin-Code": code } });
    if (r.status === 403) return false;
    const j = await r.json();
    return j?.ok === true;
  } catch {
    return null;
  }
}

/** Сохранение патча в общий site-data.json через /api/admin.php */
async function pushToServer(patch: Partial<SiteOverrides>): Promise<void> {
  const code = getAdminCode();
  if (!code) return;
  try {
    const r = await fetch("/api/admin.php?action=save", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Code": code },
      body: JSON.stringify({ data: patch }),
    });
    if (r.ok) {
      serverData = { ...(serverData ?? {}), ...patch };
    }
  } catch {
    /* офлайн — остаётся локальная копия */
  }
}

/* ---------- Переопределения контента ---------- */

export function getOverrides(): SiteOverrides {
  return read<SiteOverrides>(OVERRIDES_KEY, {});
}

export function saveOverrides(patch: Partial<SiteOverrides>): void {
  write(OVERRIDES_KEY, { ...getOverrides(), ...patch });
  void pushToServer(patch);
}

export function getHouses(): House[] {
  return serverData?.houses ?? getOverrides().houses ?? HOUSES;
}

export function saveHouses(houses: House[]): void {
  saveOverrides({ houses });
}

export function getGallery(): GalleryItem[] {
  return serverData?.gallery ?? getOverrides().gallery ?? GALLERY_ITEMS;
}

export function saveGallery(gallery: GalleryItem[]): void {
  saveOverrides({ gallery });
}

export function getServices(): Service[] {
  return serverData?.services ?? getOverrides().services ?? SERVICES;
}

export function saveServices(services: Service[]): void {
  saveOverrides({ services });
}

export const DEFAULT_ABOUT_BG = "/gallery/gal-aero.jpg";

export function getAboutBg(): string {
  return serverData?.aboutBg ?? getOverrides().aboutBg ?? DEFAULT_ABOUT_BG;
}

export function saveAboutBg(src: string): void {
  saveOverrides({ aboutBg: src });
}

export function resetOverrides(): void {
  localStorage.removeItem(OVERRIDES_KEY);
  serverData = null;
  serverBooted = false;
  notify();
  // сбрасываем и на сервере — дефолты восстановятся из сборки
  const code = getAdminCode();
  if (code) {
    fetch("/api/admin.php?action=save", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Code": code },
      body: JSON.stringify({ data: { houses: HOUSES, services: SERVICES, gallery: GALLERY_ITEMS, aboutBg: DEFAULT_ABOUT_BG } }),
    }).then(() => { serverData = null; bootstrapServer(); }).catch(() => {});
  }
}

/* ---------- React-хуки ---------- */

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

/* ---------- Заявки ---------- */

// Отправка заявки на сервер → уведомление в Telegram-чат (public/api/request.php).
function notifyTelegram(req: Request): void {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/request.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    }).catch(() => {});
  } catch {
    /* endpoint недоступен — заявка уйдёт только в серверный лог при наличии API */
  }
}

export function addRequest(input: Omit<Request, "id" | "createdAt" | "read">): void {
  const req: Request = {
    ...input,
    id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    read: false,
  };
  notifyTelegram(req);
}

/* ---------- Заявки в админке: серверный лог + локальные отметки прочтения ---------- */

export interface ServerRequest {
  id: string;
  ts: number;
  ip?: string;
  name: string;
  phone: string;
  houseName?: string | null;
  service?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  comment?: string | null;
  source?: string | null;
  tg?: boolean;
}

// Кэш серверных заявок — шапка админки и вкладка читают его
let serverRequests: ServerRequest[] = [];
let requestsFetched = false;

export async function refreshServerRequests(): Promise<void> {
  const code = getAdminCode();
  if (!code) return;
  try {
    const r = await fetch("/api/admin.php?action=requests", { headers: { "X-Admin-Code": code } });
    if (!r.ok) return;
    const j = await r.json();
    if (Array.isArray(j?.requests)) {
      serverRequests = j.requests;
      requestsFetched = true;
      notify();
    }
  } catch {
    /* офлайн */
  }
}

export function getServerRequests(): ServerRequest[] {
  return serverRequests;
}

export function useServerRequests(): ServerRequest[] {
  return useSyncExternalStore(subscribeStore, getServerRequests, () => serverRequests);
}

export function serverRequestsFetched(): boolean {
  return requestsFetched;
}

export async function deleteServerRequest(id: string): Promise<boolean> {
  const code = getAdminCode();
  try {
    const r = await fetch(`/api/admin.php?action=delete_request&id=${encodeURIComponent(id)}`, {
      headers: { "X-Admin-Code": code },
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function getReadIds(): Set<string> {
  return new Set(read<string[]>(READ_IDS_KEY, []));
}

export function markRequestRead(id: string, readIt: boolean): void {
  const ids = getReadIds();
  if (readIt) ids.add(id); else ids.delete(id);
  write(READ_IDS_KEY, [...ids]);
}
