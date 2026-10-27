// Загрузка фото админом: сжатие на canvas → JPEG → POST /api/upload.php
// (сервер, ~/data/uploads → /uploads/<file> — общие для всех устройств).
// Если сервер недоступен (dev/офлайн) — фолбэк в IndexedDB, src "idb:<key>".

import { putImage, IDB_PREFIX } from "./imgdb";
import { getAdminCode } from "./siteStore";

const MAX_SIDE = 1600;
const QUALITY = 0.82;

async function compressToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas недоступен");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Не удалось сжать фото"))),
      "image/jpeg",
      QUALITY,
    );
  });
}

async function uploadBlob(blob: Blob): Promise<string | null> {
  const code = getAdminCode();
  if (!code) return null;
  try {
    const fd = new FormData();
    fd.append("file", blob, "photo.jpg");
    fd.append("code", code);
    const r = await fetch("/api/upload.php", { method: "POST", body: fd });
    const j = await r.json();
    return j?.ok && typeof j.url === "string" ? j.url : null;
  } catch {
    return null;
  }
}

export async function storeImageFile(file: File): Promise<string> {
  const blob = await compressToJpeg(file);

  const url = await uploadBlob(blob);
  if (url) return url;

  // офлайн-фолбэк — локальный IndexedDB
  const key = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await putImage(key, blob);
  return `${IDB_PREFIX}${key}`;
}
