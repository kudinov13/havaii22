import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERR:", String(e).slice(0, 300)));
await page.setViewport({ width: 1440, height: 900 });

// 1. Админка: логин → Занятость → ставим диапазон 2026-11-10..2026-11-12
await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
await page.type('input[type="password"]', "gavai22");
await page.click('button[type="submit"]');
await new Promise((r) => setTimeout(r, 1000));

const tabs = await page.$$("nav button");
await tabs[1].click(); // Занятость
await new Promise((r) => setTimeout(r, 600));

// заполнить «Занято с / по» и нажать Занять
const dateInputs = await page.$$('input[type="date"]');
await dateInputs[0].evaluate((el, v) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}, "2026-11-10");
await dateInputs[1].evaluate((el, v) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}, "2026-11-12");
const btns = await page.$$("button");
for (const b of btns) {
  const t = await b.evaluate((e) => e.textContent);
  if (t.includes("Занять")) { await b.click(); break; }
}
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: "shots2/e2e-bookings.png" });

// 2. Сайт: открыть карточку домика, проверить «Занятые даты», заявка на занятую дату
await page.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
await page.evaluate(() => {
  document.getElementById("houses")?.scrollIntoView();
});
await new Promise((r) => setTimeout(r, 1500));
await page.evaluate(() => {
  const card = document.querySelector('#houses [role="button"]');
  card?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: "shots2/e2e-modal.png" });

// клик «Забронировать» в модалке
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((e) => e.textContent.trim() === "Забронировать");
  b?.click();
});
await new Promise((r) => setTimeout(r, 500));

// ставим занятую дату заезда
const modalDates = await page.$$('input[type="date"]');
console.log("date inputs in modal:", modalDates.length);
await modalDates[0].evaluate((el, v) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}, "2026-11-11");
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: "shots2/e2e-conflict.png" });

const state = await page.evaluate(() => {
  const warn = document.querySelector(".text-terracotta-deep");
  const submit = [...document.querySelectorAll("button")].find((e) => e.textContent.includes("Отправить заявку"));
  return { warnText: warn?.textContent?.slice(0, 80), submitDisabled: submit?.disabled };
});
console.log("conflict state:", JSON.stringify(state));

await browser.close();
console.log("done");
