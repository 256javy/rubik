import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/google-chrome",
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
await page.goto("http://localhost:5173");
await page.locator("canvas").waitFor();
await page.screenshot({
  path: "artifacts/desktop-initial.png",
  fullPage: true,
});
await page.getByText("Herramientas de desarrollo", { exact: true }).click();
await page.getByRole("button", { name: "Mezcla reproducible (42)" }).click();
await page
  .getByRole("button", { name: "Empezar tutorial" })
  .click({ timeout: 30000 });
await page.getByRole("button", { name: "Ver pasos antes de empezar" }).click();
await page
  .getByRole("button", { name: "Reproducir", exact: true })
  .waitFor({ state: "visible" });
await page.screenshot({ path: "artifacts/desktop-guide.png", fullPage: true });
await page.getByRole("button", { name: "Perspectiva doble" }).click();
await page.screenshot({ path: "artifacts/desktop-dual.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "artifacts/mobile-dual.png", fullPage: true });
await browser.close();
