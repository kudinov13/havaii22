"use client";

// Общие элементы админки: img с резолвом idb:-ссылок, кнопка загрузки фото, поля формы.

import { useRef, useState, type ReactNode } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useImageSrc } from "@/lib/useImageSrc";
import { storeImageFile } from "@/lib/imageFile";
import { cn } from "@/lib/utils";

/** img, понимающий "idb:<key>" из IndexedDB */
export function AdminImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const url = useImageSrc(src);
  if (!url) {
    return <div className={cn("flex items-center justify-center bg-sand text-ink-muted/50", className)}>…</div>;
  }
  return <img src={url} alt={alt} className={cn("object-cover", className)} />;
}

/** Кнопка загрузки фото: сжимает → IndexedDB → отдаёт src "idb:<key>" */
export function UploadButton({
  onUploaded,
  multiple = false,
  label = "Загрузить фото",
  className,
}: {
  onUploaded: (srcs: string[]) => void;
  multiple?: boolean;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const srcs: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        srcs.push(await storeImageFile(f));
      }
      if (srcs.length) onUploaded(srcs);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-2 rounded-soft border border-sand-deep bg-paper px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-sand disabled:opacity-50",
          className,
        )}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        {busy ? "Сжимаю…" : label}
      </button>
    </>
  );
}

/** Поле формы с лейблом */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted/80">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-soft border border-sand-deep bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-emerald/50";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-pill bg-terracotta px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-terracotta-deep disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-pill border border-sand-deep px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-sand disabled:opacity-50";
export const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sand hover:text-ink disabled:opacity-30";
