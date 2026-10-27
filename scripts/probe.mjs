import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));

const sample = () => page.evaluate(() => {
  const s = document.querySelector('section[aria-label="Галерея — скролл-сцена"]');
  const t = s?.querySelector(".flex.h-full");
  const sp = s?.closest(".pin-spacer");
  return { trackW: t?.scrollWidth, pos: getComputedStyle(s).position, spacerH: sp?.offsetHeight, spacerM: sp && getComputedStyle(sp).marginBottom };
});

console.log("rel:", JSON.stringify(await sample()));
await page.evaluate(() => window.scrollTo(0, 3000));
await new Promise((r) => setTimeout(r, 800));
console.log("mid:", JSON.stringify(await sample()));
await page.evaluate(() => window.scrollTo(0, 15000));
await new Promise((r) => setTimeout(r, 800));
console.log("far:", JSON.stringify(await sample()));
await browser.close();
