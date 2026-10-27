import type { Metadata } from "next";
import { Cormorant, Manrope } from "next/font/google";
import "./globals.css";

// Cormorant — editorial serif с кириллицей, премиальный display-шрифт.
const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Manrope — чистый тёплый гротеск с кириллицей для body/UI.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Гавайи22 — база отдыха на легендарных 22 карьерах",
  description:
    "База отдыха «Гавайи22» в с. Верх-Катунское: домики у самой воды, свой пляж, баня на дровах, SUP и катамараны. Круглый год, 22 км от Бийска.",
  keywords: ["база отдыха", "Гавайи22", "22 карьеры", "Верх-Катунское", "домики", "отдых", "баня", "Бийск"],
  openGraph: {
    title: "Гавайи22",
    description: "База отдыха на легендарных 22 карьерах — домики у самой воды.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
