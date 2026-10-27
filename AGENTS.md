<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ривьера на Карьере — премиальная база отдыха у изумрудной воды карьера

## Стек
- **Next.js 16.3** (App Router, RSC) + **TypeScript** + **Tailwind v4** (`@tailwindcss/postcss`)
- **Static export**: `output: "export"` → `out/index.html` (шаблон для прокликивания)
- **Анимации:** GSAP + ScrollTrigger (скролл-сцены/параллакс/reveal/pin), Motion `motion/react` (микро/hover/модалы)
- **Иконки:** `lucide-react` (SVG, не эмодзи). Камин = `FlameKindling` (нет `Fireplace` в lucide)
- **Шрифты:** `next/font` — Cormorant (display serif, кириллица) + Manrope (body, кириллица)

## Команды
- `npm run dev` — dev-сервер (http://localhost:3000)
- `npm run build` — production + static export → `out/index.html`
- `npm run lint` — ESLint

## Дизайн: Riviera di Cava
- Светлая тёплая палитра: cream/cream-deep/sand, terracotta (CTA), emerald (вода карьера), gold (детали), ink (текст), paper (карточки)
- Editorial serif типографика, фото в рамках-паспарту, минимальный радиус (4px), тёплые тени
- Утилиты: `frame-passepartout`, `gold-rule`, `glass-warm`, `paper-grain`, `no-scrollbar`, `ken-burns`

## Что готово (главная страница, демо для заказчика)
- **Hero**: fullscreen SVG-сцена (закат/вода/склоны), Ken Burns, асимметричный текст, CTA
- **About**: сторителлинг, 6 фич, 4 цифры-факта, параллакс-фон
- **HorizontalScroll**: GSAP pinned горизонтальная скролл-сцена (галерея) — главная «вау»-фича
- **Houses**: фильтр-чипы по типу, сетка равных карточек в паспарту, hover (y:-8, scale cover)
- **Services**: 6 услуг (баня, катер, шеф-гриль, SUP, йога, винный вечер)
- **TerritoryMap**: интерактивная SVG-мини-карта 3 га, 12 точек (домики/инфраструктура/вода), hover-тултипы, легенда
- **Reviews**: 4 отзыва со звёздами
- **Contacts**: адрес, часы заезда, телефон/WhatsApp/Telegram, Яндекс-карта
- **Footer**: тёмный, навигация, мини-форма «Заявка на звонок»

## Что НЕ готово (следующие шаги)
- Бронирование (форма, даты, заявки)
- Админка /admin (CRUD домиков, заявки, загрузка фото)
- Реальные фото (сейчас — художественные SVG-плейсхолдеры)
- Кастомный курсор (заказчик попросил обычный — оставили стандартный)

## Известные особенности
- Все изображения — data-URI SVG (picsum geoblocked), заменятся на реальные через админку
- `images.unoptimized: true` в next.config (static export не требует оптимизатора)
- Warning о `package-lock.json` вне git-репо — не критично

## Реальные данные бизнеса (собрано с 2GIS + VK, окт 2026)

Бизнес — **«Гавайи22» / «База отдыха Гавайи 22»** (брендинг «Ривьера на Карьере» на сайте — рабочая концепция, уточнить у заказчика).

- **Адрес:** ул. Южный берег, 31, с. Верх-Катунское, Бийский район, Алтайский край, 659374
- **Координаты:** 52.426704, 85.521491 (локация «Легендарные 22 карьеры», ~22 км от города)
- **Телефон/WhatsApp:** +7 (983) 553-02-22
- **Email:** maxim.mamontov.8500@mail.ru (ИП Мамонтов Максим Алексеевич)
- **VK:** vk.com/club226755291 (группа «База отдыха Гавайи 22», 105 подписчиков), vk.com/id871215238 («Gavayi Plyazh-Baza»), Instagram @hawaii22_bsk
- **2GIS:** firm/70000001091372871 — рейтинг 5.0, 103 оценки, 39 отзывов, 92 фото
- **Режим:** круглосуточно, круглый год; оплата картой/наличные/перевод

### Цены (2GIS, обновлено 08.08.2026)
- Домик на 6 чел — от 10 000₽/сутки (кухня, душ, туалет, ТВ 200+ каналов, кондиционер, мангальная зона + беседка). Акция из VK: пн–чт 7000₽ (была до 31.10.2024 — проверить актуальность)
- Домик на 4 чел — 10 000₽/сутки
- Баня (русская парная на дровах, у озера) — 1500₽/час, от 3 часов, до 6 чел (2GIS также указывает «час 1500₽, до 5 чел»)
- Беседка с баней — от 2000₽/час, с баней-бочкой от 2500₽/час (холодильник, вода, мангальная зона, огорожено)
- SUP-прокат — 400₽/30 мин, 700₽/час (жилеты включены); также катамараны
- Мини-бар: пиво, лимонады, мороженое

### Факты из отзывов/описаний
- Домики новые, до 6 мест; фен, микроволновка, посуда, зубные щётки, полотенца
- У каждого домика своя беседка + мангал (шпажки, решётка, казан ~20 л)
- Вечером подсветка домиков светодиодными лентами; охрана на территории
- Озеро не замерзает круглый год; свой пляж, шезлонги, пологий вход (для детей)
- Рыбалка (удочки свои); «22 метра от шезлонга до воды» — отсюда название

### Фото (реальные URL)
- `public/hero/Hero.jpg`, `public/gallery/Pamyat1–4.png` — уже скачаны
- 2GIS photo CDN: `i{n}.photo.2gis.com/photo-gallery/{uuid}.jpg` — известен uuid `b3005cb3-640b-4931-b347-b92047c8d199`
- 2GIS review-photos CDN: `cachizer{n}.2gis.com/reviews-photos/{uuid}.jpg?w=…` — ~15 uuid из отзывов
- VK CDN: `sun9-*.vkuserphoto.ru/…jpg` — 2 постовых фото + аватар (URL в логах сессии 03.10)

### Доступ к источникам (для продолжения)
- 2gis.ru и vk.com блокируют прямой fetch (403/anti-bot). Работает прокси `https://r.jina.ai/<url>` (2GIS — все вкладки; VK — `m.vk.com/club…` стена читается, альбомы /photos /albums — bot check)
- Wayback: снапшотов нет

## Админка и заявки (реализовано, окт 2026)

- `/admin`, код `gavai22` (демо-доступ, sessionStorage). Вкладки: Заявки / Занятость / Домики / Услуги / Фото сайта.
- Хранилище: `lib/siteStore.ts` — localStorage (`g22_overrides`, `g22_requests`) + IndexedDB для фото (`idb:<key>`, резолв через `useImageSrc`). **Данные живут только в браузере устройства** — для продакшена нужен бэкенд.
- `House.blockedDates?: string[]` — занятые даты ISO; вкладка «Занятость» ставит диапазоны, в карточке домика они видны и блокируют заявку на эти даты.
- Галерея «Кадры на память»: состав кадров фиксирован — только замена фото/подписи/порядок (без добавления и удаления).

### Модель заявки (Request) — для будущего Telegram-бота
```ts
{ name, phone, comment?, houseId?, houseName?, service?, checkIn?, checkOut?, source, createdAt, read }
```
- Формы: карточка домика (домик + даты + доп. услуга + комментарий) и футер (домик + комментарий). Оплаты на сайте нет.
- **План при деплое на хостинг:** заявки POST-ить в бота/endpoint → админам в ЛС; админы помечают занятые даты через бота (без входа в /admin). Бот и бэкенд создадим при выгрузке.
