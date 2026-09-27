import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:4173");
await expect(page.locator("canvas")).toHaveCount(1);
await expect(
  page.getByText("Herramientas de desarrollo", { exact: true }),
).toHaveCount(0);
await page.getByRole("button", { name: "Mezclar cubo", exact: true }).click();
await page.getByRole("button", { name: "Empezar tutorial" }).click();
await page.getByRole("button", { name: "Ver pasos antes de empezar" }).click();
await expect(
  page.getByRole("button", { name: "Movimiento siguiente" }),
).toBeEnabled();
await page.getByRole("button", { name: "Movimiento siguiente" }).click();
await expect(
  page.getByRole("button", { name: "Movimiento anterior" }),
).toBeEnabled();
await page.getByRole("button", { name: "Movimiento anterior" }).click();
await expect(page.locator(".timeline>span")).toHaveText(/^0 \/ /);
await page.screenshot({
  path: "artifacts/production-desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
await page.getByRole("button", { name: "Perspectiva doble" }).click();
await page.screenshot({
  path: "artifacts/production-mobile.png",
  fullPage: true,
});
expect(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
).toBe(true);
expect(errors).toEqual([]);
console.log(
  "Production smoke passed: worker, animation, undo, desktop/mobile and no development panel.",
);
await browser.close();
