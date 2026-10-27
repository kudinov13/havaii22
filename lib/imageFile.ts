// Загрузка фото админом: сжатие на canvas → JPEG blob → IndexedDB.
// Возвращает src-ссылку вида "idb:<key>".

import { putImage, IDB_PREFIX } from "./imgdb";

const MAX_SIDE = 1600;
const QUALITY = 0.82;

export async function storeImageFile(file: File): Promise<string> {
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

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Не удалось сжать фото"))),
      "image/jpeg",
      QUALITY,
    );
  });

  const key = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await putImage(key, blob);
  return `${IDB_PREFIX}${key}`;
}
