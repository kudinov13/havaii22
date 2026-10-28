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
  metadataBase: new URL("https://hawaii22.ru"),
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
        {/* Логотип и данные организации — чтобы поисковики показывали знак */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LodgingBusiness",
              name: "Гавайи22",
              alternateName: "База отдыха Гавайи 22",
              url: "https://hawaii22.ru/",
              logo: "https://hawaii22.ru/logo.svg",
              image: "https://hawaii22.ru/hero/Hero.jpg",
              telephone: "+7 983 553-02-22",
              address: {
                "@type": "PostalAddress",
                streetAddress: "ул. Южный берег, 31",
                addressLocality: "с. Верх-Катунское, Бийский район",
                addressRegion: "Алтайский край",
                postalCode: "659374",
                addressCountry: "RU",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
