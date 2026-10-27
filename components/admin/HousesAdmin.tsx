"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Pencil, Trash2, Star, ChevronUp, ChevronDown, X, Save } from "lucide-react";
import type { House, HouseImage, Amenity, HouseType, HouseStatus } from "@/lib/types";
import { AMENITY_LABELS, HOUSE_TYPE_LABELS, HOUSE_STATUS_LABELS } from "@/lib/types";
import { saveHouses, useHouses } from "@/lib/siteStore";
import { isIdbSrc, idbKey, deleteImage } from "@/lib/imgdb";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AdminImage, UploadButton, Field, inputCls, btnPrimary, btnGhost, iconBtn } from "./ui";

const AMENITY_KEYS = Object.keys(AMENITY_LABELS) as Amenity[];

function emptyHouse(): House {
  const id = `h_${Date.now().toString(36)}`;
  return {
    id,
    slug: id,
    name: "Новый домик",
    type: "family",
    status: "free",
    shortDesc: "",
    description: "",
    pricePerNight: 0,
    guests: 2,
    area: 0,
    amenities: [],
    images: [],
  };
}

/* ---------- Редактор фото домика ---------- */

function PhotoManager({
  images,
  onChange,
}: {
  images: HouseImage[];
  onChange: (imgs: HouseImage[]) => void;
}) {
  function update(id: string, patch: Partial<HouseImage>) {
    onChange(images.map((im) => (im.id === id ? { ...im, ...patch } : im)));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = images.findIndex((im) => im.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= images.length) return;
    const next = [...images];
    [next[idx], next[to]] = [next[to], next[idx]];
    onChange(next.map((im, i) => ({ ...im, order: i })));
  }

  async function remove(id: string) {
    const im = images.find((x) => x.id === id);
    if (im && isIdbSrc(im.src)) await deleteImage(idbKey(im.src)).catch(() => {});
    const next = images.filter((x) => x.id !== id).map((x, i) => ({ ...x, order: i }));
    // обложкой становится первое фото, если удалили обложку
    if (!next.some((x) => x.isCover) && next.length) next[0].isCover = true;
    onChange(next);
  }

  function setCover(id: string) {
    onChange(images.map((im) => ({ ...im, isCover: im.id === id })));
  }

  function addPhotos(srcs: string[]) {
    const base = images.length;
    onChange([
      ...images,
      ...srcs.map((src, i) => ({
        id: `img_${Date.now().toString(36)}_${i}`,
        src,
        alt: "",
        order: base + i,
        isCover: images.length === 0 && i === 0,
      })),
    ]);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((im) => (
          <figure key={im.id} className={cn("relative overflow-hidden rounded-soft border-2", im.isCover ? "border-terracotta" : "border-transparent")}>
            <AdminImage src={im.src} alt={im.alt} className="aspect-[4/3] w-full" />
            {im.isCover && (
              <span className="absolute left-2 top-2 rounded-pill bg-terracotta px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
                Обложка
              </span>
            )}
            <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-ink/70 p-1 backdrop-blur-sm">
              <button type="button" onClick={() => move(im.id, -1)} className={iconBtn} aria-label="Раньше"><ChevronUp size={14} className="text-cream" /></button>
              <button type="button" onClick={() => setCover(im.id)} className={iconBtn} aria-label="Сделать обложкой" title="Обложка">
                <Star size={14} className={im.isCover ? "fill-gold text-gold" : "text-cream"} />
              </button>
              <button type="button" onClick={() => move(im.id, 1)} className={iconBtn} aria-label="Позже"><ChevronDown size={14} className="text-cream" /></button>
              <button type="button" onClick={() => remove(im.id)} className={iconBtn} aria-label="Удалить фото"><Trash2 size={14} className="text-cream" /></button>
            </figcaption>
            <input
              type="text"
              value={im.alt}
              placeholder="Подпись (alt)"
              onChange={(e) => update(im.id, { alt: e.target.value })}
              className="w-full border-t border-sand-deep/40 bg-paper px-2 py-1.5 text-xs text-ink placeholder:text-ink-muted/50 focus:outline-none"
            />
          </figure>
        ))}

        <UploadButton
          multiple
          onUploaded={addPhotos}
          label="Добавить"
          className="aspect-[4/3] w-full flex-col !border-dashed"
        />
      </div>
      <p className="mt-2 text-xs text-ink-muted/70">★ — обложка (главное фото карточки на сайте). Фото сжимаются до 1600px.</p>
    </div>
  );
}

/* ---------- Форма редактирования домика ---------- */

function HouseEditor({ house, onSave, onClose }: { house: House; onSave: (h: House) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<House>(house);

  function patch(p: Partial<House>) { setDraft((d) => ({ ...d, ...p })); }

  function toggleAmenity(a: Amenity) {
    patch({ amenities: draft.amenities.includes(a) ? draft.amenities.filter((x) => x !== a) : [...draft.amenities, a] });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label="Редактирование домика"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden bg-cream sm:rounded-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sand-deep/50 px-5 py-4 sm:px-7">
          <h3 className="font-display text-2xl font-medium text-ink">
            {house.name === "Новый домик" ? "Новый домик" : `Редактировать: ${house.name}`}
          </h3>
          <button onClick={onClose} className={iconBtn} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название">
              <input className={inputCls} value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Короткое описание">
              <input className={inputCls} value={draft.shortDesc} onChange={(e) => patch({ shortDesc: e.target.value })} placeholder="Для карточки на сайте" />
            </Field>
            <Field label="Цена за ночь, ₽">
              <input className={inputCls} type="number" min={0} value={draft.pricePerNight || ""} onChange={(e) => patch({ pricePerNight: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Гостей (макс.)">
              <input className={inputCls} type="number" min={1} value={draft.guests} onChange={(e) => patch({ guests: Number(e.target.value) || 1 })} />
            </Field>
            <Field label="Площадь, м²" hint="0 — не показывать на сайте">
              <input className={inputCls} type="number" min={0} value={draft.area || ""} onChange={(e) => patch({ area: Number(e.target.value) || 0 })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Тип">
                <select className={inputCls} value={draft.type} onChange={(e) => patch({ type: e.target.value as HouseType })}>
                  {Object.entries(HOUSE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Статус">
                <select className={inputCls} value={draft.status} onChange={(e) => patch({ status: e.target.value as HouseStatus })}>
                  {Object.entries(HOUSE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <Field label="Полное описание">
            <textarea className={cn(inputCls, "min-h-24 resize-y")} value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Удобства</span>
            <div className="flex flex-wrap gap-2">
              {AMENITY_KEYS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  aria-pressed={draft.amenities.includes(a)}
                  className={cn(
                    "rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors",
                    draft.amenities.includes(a)
                      ? "border-emerald bg-emerald/15 text-emerald-deep"
                      : "border-sand-deep bg-paper text-ink-muted hover:bg-sand",
                  )}
                >
                  {AMENITY_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Фотографии</span>
            <PhotoManager images={draft.images} onChange={(images) => patch({ images })} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-sand-deep/50 bg-paper px-5 py-4 sm:px-7">
          <p className="text-xs text-ink-muted/70">{draft.images.length} фото · обложка — со ★</p>
          <div className="flex gap-2">
            <button onClick={onClose} className={btnGhost}>Отмена</button>
            <button onClick={() => onSave(draft)} disabled={!draft.name.trim() || draft.images.length === 0} className={btnPrimary}>
              <Save size={16} /> Сохранить
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Вкладка «Домики» ---------- */

export function HousesAdmin() {
  const houses = useHouses();
  const [editing, setEditing] = useState<House | null>(null);
  const [confirmDel, setConfirmDel] = useState<House | null>(null);

  function persist(next: House[]) {
    saveHouses(next);
  }

  function save(h: House) {
    const exists = houses.some((x) => x.id === h.id);
    persist(exists ? houses.map((x) => (x.id === h.id ? h : x)) : [...houses, h]);
    setEditing(null);
  }

  async function remove(h: House) {
    for (const im of h.images) {
      if (isIdbSrc(im.src)) await deleteImage(idbKey(im.src)).catch(() => {});
    }
    persist(houses.filter((x) => x.id !== h.id));
    setConfirmDel(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{houses.length} карточек на сайте</p>
        <button onClick={() => setEditing(emptyHouse())} className={btnPrimary}>
          <Plus size={16} /> Добавить домик
        </button>
      </div>

      <ul className="mt-5 space-y-3">
        {houses.map((h) => {
          const cover = h.images.find((im) => im.isCover) ?? h.images[0];
          return (
            <li key={h.id} className="flex items-center gap-4 rounded-soft bg-paper p-4 shadow-[var(--shadow-soft)]">
              <AdminImage src={cover?.src ?? ""} alt={h.name} className="h-16 w-24 shrink-0 rounded-soft" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{h.name}</p>
                <p className="text-sm text-ink-muted">
                  {formatPrice(h.pricePerNight)}/ночь · до {h.guests} гостей · {h.images.length} фото · {HOUSE_TYPE_LABELS[h.type]} · {HOUSE_STATUS_LABELS[h.status]}
                </p>
              </div>
              <button onClick={() => setEditing(h)} className={iconBtn} aria-label={`Редактировать ${h.name}`} title="Редактировать">
                <Pencil size={16} />
              </button>
              <button onClick={() => setConfirmDel(h)} className={iconBtn} aria-label={`Удалить ${h.name}`} title="Удалить">
                <Trash2 size={16} />
              </button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {editing && (
          <HouseEditor
            key={editing.id}
            house={editing}
            onSave={save}
            onClose={() => setEditing(null)}
          />
        )}
        {confirmDel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 p-5 backdrop-blur-sm"
            onClick={() => setConfirmDel(null)}
          >
            <div className="w-full max-w-sm rounded-soft bg-paper p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-xl font-medium text-ink">Удалить «{confirmDel.name}»?</h3>
              <p className="mt-2 text-sm text-ink-muted">Карточка и её фото будут удалены с сайта. Действие можно отменить только кнопкой «Сбросить все правки».</p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setConfirmDel(null)} className={btnGhost}>Отмена</button>
                <button onClick={() => remove(confirmDel)} className={cn(btnPrimary, "!bg-terracotta-deep")}>Удалить</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
