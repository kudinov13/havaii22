"use client";

import { ChevronUp, ChevronDown, Lock, RotateCcw } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import {
  saveGallery,
  saveAboutBg, DEFAULT_ABOUT_BG,
  useGallery, useAboutBg,
} from "@/lib/siteStore";
import { isIdbSrc, idbKey, deleteImage } from "@/lib/imgdb";
import { cn } from "@/lib/utils";
import { AdminImage, UploadButton, Field, inputCls, iconBtn } from "./ui";

async function cleanupSrc(src: string) {
  if (isIdbSrc(src)) await deleteImage(idbKey(src)).catch(() => {});
}

/* ---------- Слот одиночного фото (фон «О базе», hero) ---------- */

function PhotoSlot({
  title, note, src, onReplace, onReset, locked,
}: {
  title: string;
  note?: string;
  src: string;
  onReplace?: (src: string) => void;
  onReset?: () => void;
  locked?: boolean;
}) {
  return (
    <div className="rounded-soft bg-paper p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{title}</h3>
          {note && <p className="mt-0.5 text-xs text-ink-muted">{note}</p>}
        </div>
        {locked ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-sand px-3 py-1 text-xs font-medium text-ink-muted">
            <Lock size={12} /> Зафиксировано
          </span>
        ) : (
          <div className="flex items-center gap-2">
            {onReset && (
              <button onClick={onReset} className={iconBtn} aria-label="Вернуть исходное фото" title="Вернуть исходное">
                <RotateCcw size={15} />
              </button>
            )}
            {onReplace && (
              <UploadButton
                label="Заменить"
                onUploaded={([src]) => onReplace(src)}
              />
            )}
          </div>
        )}
      </div>
      <AdminImage src={src} alt={title} className="mt-3 h-40 w-full rounded-soft" />
    </div>
  );
}

/* ---------- Вкладка «Фото сайта» ---------- */

export function PhotosAdmin() {
  const items = useGallery();
  const aboutBg = useAboutBg();

  function persistGallery(next: GalleryItem[]) {
    saveGallery(next);
  }

  function patchItem(id: string, patch: Partial<GalleryItem>) {
    persistGallery(items.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((g) => g.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= items.length) return;
    const next = [...items];
    [next[idx], next[to]] = [next[to], next[idx]];
    persistGallery(next);
  }

  return (
    <div className="space-y-8">
      {/* Галерея — состав кадров фиксированный: только замена фото, подписи и порядок */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-medium text-ink">Галерея — скролл-сцена</h3>
            <p className="mt-0.5 text-xs text-ink-muted">Фото и подписи в секции «Кадры на память». Количество кадров фиксировано — можно менять фото, подписи и порядок.</p>
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          {items.map((g, i) => (
            <li key={g.id} className="flex flex-col gap-3 rounded-soft bg-paper p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
              <AdminImage src={g.src} alt={g.alt || g.caption} className="h-20 w-32 shrink-0 rounded-soft" />
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Field label="Подпись на сайте">
                  <input className={inputCls} value={g.caption} onChange={(e) => patchItem(g.id, { caption: e.target.value })} />
                </Field>
                <Field label="Alt (для доступности)">
                  <input className={inputCls} value={g.alt} onChange={(e) => patchItem(g.id, { alt: e.target.value })} />
                </Field>
              </div>
              <div className="flex items-center gap-1 sm:flex-col">
                <UploadButton
                  label="Заменить"
                  onUploaded={async ([src]) => { await cleanupSrc(g.src); patchItem(g.id, { src }); }}
                  className="!px-3 !py-1.5 text-xs"
                />
                <div className="flex gap-1">
                  <button onClick={() => move(g.id, -1)} disabled={i === 0} className={iconBtn} aria-label="Раньше"><ChevronUp size={15} /></button>
                  <button onClick={() => move(g.id, 1)} disabled={i === items.length - 1} className={iconBtn} aria-label="Позже"><ChevronDown size={15} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Прочие фото */}
      <div>
        <h3 className="font-display text-xl font-medium text-ink">Фоны секций</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <PhotoSlot
            title="Фон раздела «О базе»"
            note="Приглушённая картинка за текстом про базу"
            src={aboutBg}
            onReplace={async (src) => { await cleanupSrc(aboutBg); saveAboutBg(src); }}
            onReset={async () => { await cleanupSrc(aboutBg); saveAboutBg(DEFAULT_ABOUT_BG); }}
          />
          <PhotoSlot
            title="Hero — главный экран"
            note="По ТЗ не редактируется"
            src="/hero/Hero.jpg"
            locked
          />
        </div>
      </div>

      <div className={cn("rounded-soft border border-sand-deep bg-paper/60 p-4 text-xs leading-relaxed text-ink-muted")}>
        Загруженные фото и правки сохраняются на сервере — видны всем посетителям.
        Если сайт открыт локально без бэкенда, фото уйдут в IndexedDB браузера.
      </div>
    </div>
  );
}
