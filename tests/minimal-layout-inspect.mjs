import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:4173");
await expect(page.locator(".site-header, footer")).toHaveCount(0);
await expect(
  page.getByRole("button", { name: "Expandir ajustes del cubo" }),
).toBeVisible();
for (const [width, height] of [
  [1024, 768],
  [768, 1024],
  [390, 844],
  [320, 640],
]) {
  await page.setViewportSize({ width, height });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/minimal-${width}.png`,
    fullPage: true,
  });
}
await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
await expect(page.getByLabel("Modo de cámara")).toBeVisible();
const camera = page.getByRole("button", { name: "Cámara automática" });
const select = page.getByLabel("Modo de cámara");
const cb = await camera.boundingBox(),
  sb = await select.boundingBox();
expect(cb.y + cb.height <= sb.y).toBe(true);
expect(errors).toEqual([]);
await browser.close();
console.log("Minimal layout passed at 1024, 768, 390 and 320 px.");
