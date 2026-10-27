// Скриншоты секций сайта через системный Chrome (puppeteer-core).
// node scripts/shots.mjs [url] [outdir]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const URL_ = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "shots";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--hide-scrollbars", "--force-device-scale-factor=1"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL_, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500)); // дать GSAP/шрифтам просчитаться

const sections = await page.$$eval("section[id]", (els) =>
  els.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top + window.scrollY, h: el.getBoundingClientRect().height })),
);
console.log("sections:", JSON.stringify(sections));

let i = 0;
for (const s of sections) {
  // секцию в верх viewport (учитывая pin-спейсеры — просто скроллим по document offset)
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.max(0, s.top - 60));
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `${OUT}/${String(i).padStart(2, "0")}-${s.id || "sec"}.png` });
  console.log(`shot ${s.id}`);
  i++;
}

// середина и конец страницы на всякий случай
const total = await page.evaluate(() => document.body.scrollHeight);
await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), total);
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: `${OUT}/99-bottom.png` });

await browser.close();
console.log("done →", OUT);
