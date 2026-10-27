"use client";

// Резолвит src-ссылки: "idb:<key>" → blob URL из IndexedDB, иначе возвращает как есть.

import { useEffect, useState } from "react";
import { getImage, isIdbSrc, idbKey } from "./imgdb";

export function useImageSrc(src: string | undefined): string {
  const [resolved, setResolved] = useState<{ src: string; url: string } | null>(null);

  useEffect(() => {
    if (!src || !isIdbSrc(src)) return;

    let alive = true;
    let objUrl = "";
    getImage(idbKey(src)).then((blob) => {
      if (!alive || !blob) return;
      objUrl = URL.createObjectURL(blob);
      setResolved({ src, url: objUrl });
    });
    return () => {
      alive = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [src]);

  if (!src) return "";
  if (!isIdbSrc(src)) return src;
  return resolved?.src === src ? resolved.url : "";
}

/** Резолв массива ссылок — для галерей модалки (индексы совпадают). */
export function useImageSrcs(srcs: string[]): string[] {
  const key = srcs.join("|");
  const [resolved, setResolved] = useState<{ key: string; urls: string[] } | null>(null);

  useEffect(() => {
    let alive = true;
    const objUrls: string[] = [];

    Promise.all(
      srcs.map(async (src) => {
        if (!isIdbSrc(src)) return src;
        const blob = await getImage(idbKey(src));
        if (!blob) return "";
        const u = URL.createObjectURL(blob);
        objUrls.push(u);
        return u;
      }),
    ).then((urls) => {
      if (alive) setResolved({ key, urls });
      else objUrls.forEach(URL.revokeObjectURL);
    });

    return () => {
      alive = false;
      objUrls.forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (resolved?.key === key) return resolved.urls;
  return srcs.map((s) => (isIdbSrc(s) ? "" : s));
}
