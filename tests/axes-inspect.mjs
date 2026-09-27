import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/google-chrome",
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:5173");
await page.getByText("Ayudas visuales", { exact: true }).click();
await page.getByRole("button", { name: "Mostrar ejes", exact: true }).click();
await page.getByText("Orientación", { exact: true }).click();
await page.getByText("Cambiar orientación", { exact: true }).click();
await page.screenshot({ path: "artifacts/axes-desktop.png", fullPage: true });
await page.getByLabel("Frente (F)", { exact: true }).selectOption("R");
await page.getByLabel("Arriba (U)", { exact: true }).selectOption("D");
await page
  .getByRole("button", { name: "Establecer F y U", exact: true })
  .click();
await page.getByText("Vista", { exact: true }).click();
await page.getByRole("button", { name: "Perspectiva doble" }).click();
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "artifacts/axes-mobile.png", fullPage: true });
expect(errors).toEqual([]);
console.log("Axis/reference rendering passed.");
await browser.close();
