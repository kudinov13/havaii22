import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERR:", String(e).slice(0, 200)));
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));

// логин
await page.type('input[type="password"]', "gavai22");
await page.click('button[type="submit"]');
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: "shots2/admin-requests.png" });

// вкладки: 1=Занятость, 3=Услуги, 4=Фото
const tabs = await page.$$("nav button");
const names = await Promise.all(tabs.map((t) => t.evaluate((e) => e.textContent)));
console.log("tabs:", names.join(" | "));

await tabs[1].click(); await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "shots2/admin-bookings.png" });

await tabs[3].click(); await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "shots2/admin-services.png" });

await tabs[4].click(); await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "shots2/admin-photos.png" });

await browser.close();
console.log("done");
