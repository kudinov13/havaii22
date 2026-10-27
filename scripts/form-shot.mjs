import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERR:", String(e).slice(0, 300)));
await page.setViewport({ width: 1440, height: 1100 });
await page.goto("http://localhost:3000", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

await page.evaluate(() => document.getElementById("houses")?.scrollIntoView());
await new Promise((r) => setTimeout(r, 2000));
await page.evaluate(() => {
  document.querySelector('#houses [role="button"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 1500));
console.log("dialog:", await page.evaluate(() => !!document.querySelector('[role="dialog"]')));

await page.evaluate(() => {
  [...document.querySelectorAll('[role="dialog"] button')].find((e) => e.textContent.trim() === "Забронировать")?.click();
});
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "shots2/form-modal.png" });
await browser.close();
console.log("done");
