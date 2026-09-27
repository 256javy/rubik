import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:4173");
await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
await page.getByRole("button", { name: "Colapsar ajustes del cubo" }).click();
await expect(
  page.getByRole("heading", { name: "Ajustes del cubo" }),
).toBeVisible();
await expect(
  page.getByText("Ayudas visuales", { exact: true }),
).not.toBeVisible();
await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
await page.getByText("Ayudas visuales", { exact: true }).click();
await expect(page.locator(".settings-section[open]")).toHaveCount(1);
await page.getByRole("button", { name: "Destacar objetivo" }).click();
await page.getByRole("button", { name: "Atenuar otras piezas" }).click();
await page.reload();
await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
await page.getByText("Ayudas visuales", { exact: true }).click();
await expect(
  page.getByRole("button", { name: "Destacar objetivo" }),
).toHaveAttribute("aria-pressed", "false");
await expect(
  page.getByRole("button", { name: "Atenuar otras piezas" }),
).toHaveAttribute("aria-pressed", "false");
await page
  .locator(".control-center")
  .screenshot({ path: "artifacts/control-center-desktop.png" });
await page.setViewportSize({ width: 390, height: 844 });
await page.getByText("Orientación", { exact: true }).click();
await page.getByText("Cambiar orientación", { exact: true }).click();
await page
  .locator(".control-center")
  .screenshot({ path: "artifacts/control-center-mobile.png" });
expect(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
).toBe(true);
await expect(page.locator(".settings-section[open]")).toHaveCount(1);
await browser.close();
console.log(
  "Control sections, saved visual preferences and mobile layout passed.",
);
