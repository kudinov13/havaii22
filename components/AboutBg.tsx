"use client";

// Параллакс-фон секции «О базе». Картинку можно заменить в админке —
// берётся из siteStore (дефолт /about/territory.jpg).

import { Parallax } from "./Reveal";
import { useAboutBg } from "@/lib/siteStore";
import { useImageSrc } from "@/lib/useImageSrc";

export function AboutBg() {
  const src = useAboutBg();
  const url = useImageSrc(src);

  return (
    <div className="absolute inset-0 -z-0" aria-hidden="true">
      <Parallax speed={-8} className="absolute inset-x-0 top-0 h-[115%]">
        <div
          className="h-full w-full bg-cover bg-center opacity-[0.08]"
          style={url ? { backgroundImage: `url("${url}")` } : undefined}
        />
      </Parallax>
    </div>
  );
}
