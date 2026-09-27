import { test, expect, type Page } from "@playwright/test";
async function inspectState(page: Page) {
  return JSON.parse(await page.locator(".debug-content pre").innerText());
}
async function prepare(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
  await page.getByText("Herramientas de desarrollo", { exact: true }).click();
  await page
    .getByLabel("Inspeccionar identidades, posiciones y orientación")
    .check();
  await page.getByRole("button", { name: "Mezcla reproducible (42)" }).click();
  await expect(
    page.getByRole("button", { name: "Empezar tutorial" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Empezar tutorial" }).click();
}
test("all seven stages, exact history navigation and explicit stage boundaries", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await prepare(page);
  const start = await inspectState(page);
  await page
    .getByRole("button", { name: "Ver pasos antes de empezar" })
    .click();
  await expect(
    page.getByRole("button", { name: "Movimiento siguiente" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Movimiento siguiente" }).click();
  await expect(
    page.getByRole("button", { name: "Movimiento anterior" }),
  ).toBeEnabled();
  const moved = await inspectState(page);
  expect(moved).not.toEqual(start);
  await page.getByRole("button", { name: "Movimiento anterior" }).click();
  await expect(
    page.getByRole("button", { name: "Movimiento siguiente" }),
  ).toBeEnabled();
  expect(await inspectState(page)).toEqual(start);
  await page.getByRole("button", { name: "Movimiento siguiente" }).click();
  await expect(
    page.getByRole("button", { name: "Movimiento anterior" }),
  ).toBeEnabled();
  expect(await inspectState(page)).toEqual(moved);
  await page.getByRole("button", { name: "Perspectiva doble" }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByText("Vista opuesta", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Inicio de la demostración" }).click();
  expect(await inspectState(page)).toEqual(start);
  await page.getByRole("button", { name: "Final de la demostración" }).click();
  await expect(
    page.getByRole("button", { name: "Final de la demostración" }),
  ).toBeDisabled();
  for (let i = 0; i < 4; i++) {
    if (await page.getByRole("button", { name: "Continuar al paso 2" }).count())
      break;
    await page
      .getByRole("button", { name: "Ver pasos antes de empezar" })
      .click();
    await expect(
      page.getByRole("button", { name: "Final de la demostración" }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Final de la demostración" })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "La cruz blanca", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continuar al paso 2" }),
  ).toBeVisible();
  const cross = await inspectState(page);
  await page.getByRole("button", { name: "Continuar al paso 2" }).click();
  await expect(
    page.getByRole("heading", { name: "Las esquinas blancas", exact: true }),
  ).toBeVisible();
  await page.getByText("Explorar con giros manuales", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Deshacer", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "R", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Deshacer", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Reiniciar etapa" }).click();
  expect(await inspectState(page)).toEqual(cross);
  for (let i = 0; i < 4; i++) {
    if (await page.getByRole("button", { name: "Continuar al paso 3" }).count())
      break;
    await page
      .getByRole("button", { name: "Ver pasos antes de empezar" })
      .click();
    await expect(
      page.getByRole("button", { name: "Final de la demostración" }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Final de la demostración" })
      .click();
  }
  await expect(
    page.getByRole("button", { name: "Continuar al paso 3" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar al paso 3" }).click();
  const firstLayer = await inspectState(page);
  for (let i = 0; i < 4; i++) {
    if (await page.getByRole("button", { name: "Continuar al paso 4" }).count())
      break;
    await page
      .getByRole("button", { name: "Ver pasos antes de empezar" })
      .click();
    await expect(
      page.getByRole("button", { name: "Final de la demostración" }),
    ).toBeEnabled();
    await expect(
      page.getByText("Inserción de la arista", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Final de la demostración" })
      .click();
  }
  await expect(
    page.getByRole("button", { name: "Continuar al paso 4" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "La segunda capa", exact: true }),
  ).toBeVisible();
  const secondLayer = await inspectState(page);
  for (const p of secondLayer.filter((p: any) => p.solvedPosition[1] === 1)) {
    expect(p).toEqual(firstLayer.find((q: any) => q.id === p.id));
  }
  await page.getByRole("button", { name: "Continuar al paso 4" }).click();
  const titles = [
    "La cruz amarilla",
    "Las aristas amarillas",
    "Las últimas esquinas",
    "La orientación final",
  ];
  for (let stage = 4; stage <= 7; stage++) {
    await expect(
      page.getByRole("heading", {
        name: titles[stage - 4],
        exact: true,
        level: 1,
      }),
    ).toBeVisible();
    const endButton = page.getByRole("button", {
      name: stage === 7 ? "Volver a mezclar" : `Continuar al paso ${stage + 1}`,
      exact: true,
    });
    for (
      let attempt = 0;
      attempt < 8 && !(await endButton.count());
      attempt++
    ) {
      await page
        .getByRole("button", {
          name: "Ver pasos antes de empezar",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("button", { name: "Final de la demostración" }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Final de la demostración" })
        .click();
    }
    await expect(endButton).toBeVisible();
    const actual = await inspectState(page);
    for (const p of actual.filter((p: any) => p.solvedPosition[1] !== -1))
      expect(p).toEqual(secondLayer.find((q: any) => q.id === p.id));
    if (stage >= 4)
      for (const p of actual.filter(
        (p: any) => p.type === "edge" && p.solvedPosition[1] === -1,
      ))
        expect(
          p.stickers.find((s: any) => s.color === "yellow").normal,
        ).toEqual([0, -1, 0]);
    if (stage >= 5)
      for (const p of actual.filter((p: any) => p.type === "edge"))
        expect(p.position).toEqual(p.solvedPosition);
    if (stage >= 6)
      for (const p of actual) expect(p.position).toEqual(p.solvedPosition);
    if (stage === 7)
      for (const p of actual) expect(p.stickers).toEqual(p.solvedStickers);
    if (stage < 7) await endButton.click();
  }
  expect(errors).toEqual([]);
});
test("mobile view stays within viewport and rapid navigation commits a single legal move", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  await page.getByRole("button", { name: "Perspectiva doble" }).click();
  await expect(page.locator(".cube-viewport")).toHaveClass(/dual/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Ver pasos antes de empezar" })
    .click();
  await expect(
    page.getByRole("button", { name: "Movimiento siguiente" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Movimiento siguiente" }).dblclick();
  await expect(
    page.getByRole("button", { name: "Movimiento anterior" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Inicio de la demostración" }).click();
  await expect(page.locator(".timeline>span")).toHaveText(/^0 \/ /);
});

test("pause finishes only the active turn and resume completes the demonstration", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
  await page.getByText("Herramientas de desarrollo", { exact: true }).click();
  await page.getByLabel("Notación", { exact: true }).fill("R U R' U'");
  await page
    .getByRole("button", { name: "Preparar secuencia", exact: true })
    .click();
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reproducir", exact: true }),
  ).toBeEnabled();
  const cursor = await page.locator(".timeline>span").innerText();
  await page.waitForTimeout(700);
  expect(await page.locator(".timeline>span").innerText()).toBe(cursor);
  expect(cursor).not.toBe("4 / 4");
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await expect(page.locator(".timeline>span")).toHaveText("4 / 4");
});

test("primary action prepares and plays directly; notices never move the transport", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
  await page.getByText("Herramientas de desarrollo", { exact: true }).click();
  await page.getByLabel("Notación", { exact: true }).fill("R' D' R D");
  await page
    .getByRole("button", { name: "Usar como mezcla", exact: true })
    .click();
  await page.getByRole("button", { name: "Empezar tutorial" }).click();
  await page.getByRole("button", { name: "Continuar al paso 2" }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const before = await page.locator(".transport").boundingBox();
  await page
    .getByRole("button", { name: "Mostrar cómo se coloca", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pausar recorrido", exact: true }),
  ).toBeVisible();
  const positions = await page.evaluate(async () => {
    const values: number[] = [];
    const end = performance.now() + 2800;
    while (performance.now() < end) {
      values.push(
        document.querySelector(".transport")!.getBoundingClientRect().top,
      );
      await new Promise(requestAnimationFrame);
    }
    return values;
  });
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
  expect(Math.abs(positions[0] - before!.y)).toBeLessThan(1);
  await expect(
    page.getByRole("button", { name: "Movimiento siguiente" }),
  ).toBeDisabled();
  await expect(page.locator(".content-status")).toHaveCount(0);
});

test("R2 plays as two independently navigable R turns", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
  await page.getByText("Herramientas de desarrollo", { exact: true }).click();
  await page
    .getByLabel("Inspeccionar identidades, posiciones y orientación")
    .check();
  await page.getByLabel("Notación", { exact: true }).fill("R2");
  await page
    .getByRole("button", { name: "Preparar secuencia", exact: true })
    .click();
  await expect(page.locator(".move-tokens button")).toHaveText(["R", "R"]);
  const start = await inspectState(page);
  await page.getByRole("button", { name: "Movimiento siguiente" }).click();
  await expect(page.locator(".timeline>span")).toHaveText("1 / 2");
  const halfway = await inspectState(page);
  expect(halfway).not.toEqual(start);
  await page.getByRole("button", { name: "Movimiento siguiente" }).click();
  await expect(page.locator(".timeline>span")).toHaveText("2 / 2");
  expect(await inspectState(page)).not.toEqual(halfway);
  await page.getByRole("button", { name: "Movimiento anterior" }).click();
  await expect(page.locator(".timeline>span")).toHaveText("1 / 2");
  expect(await inspectState(page)).toEqual(halfway);
});

test("reload preserves progress, axes, reference, demonstration and undo/redo", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await prepare(page);
  const start = await inspectState(page);
  await page
    .getByRole("button", { name: "Ver pasos antes de empezar", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Movimiento siguiente" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Movimiento siguiente" }).click();
  await expect(
    page.getByRole("button", { name: "Movimiento anterior" }),
  ).toBeEnabled();
  const halfway = await inspectState(page);
  await page.getByText("Ayudas visuales", { exact: true }).click();
  await page.getByRole("button", { name: "Mostrar ejes", exact: true }).click();
  await page.getByText("Orientación", { exact: true }).click();
  await page.getByText("Cambiar orientación", { exact: true }).click();
  await page.getByLabel("Frente (F)", { exact: true }).selectOption("R");
  await page
    .getByRole("button", { name: "Establecer F y U", exact: true })
    .click();
  expect(await inspectState(page)).toEqual(halfway);
  const tokens = await page.locator(".move-tokens button").allTextContents();
  const cursor = await page.locator(".timeline>span").innerText();
  await page.reload();
  await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
  await expect(
    page.getByRole("heading", { name: "La cruz blanca", level: 1 }),
  ).toBeVisible();
  await page.getByText("Ayudas visuales", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mostrar ejes", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByText("Orientación", { exact: true }).click();
  await expect(page.locator(".orientation-summary")).toContainText(
    "Frente azul",
  );
  await expect(page.locator(".timeline>span")).toHaveText(cursor);
  await expect(
    page.getByRole("button", { name: "Pausar recorrido", exact: true }),
  ).toHaveCount(0);
  await page.getByText("Herramientas de desarrollo", { exact: true }).click();
  await page
    .getByLabel("Inspeccionar identidades, posiciones y orientación")
    .check();
  expect(await inspectState(page)).toEqual(halfway);
  expect(await page.locator(".move-tokens button").allTextContents()).toEqual(
    tokens,
  );
  await page.getByRole("button", { name: "Movimiento anterior" }).click();
  await expect(page.locator(".timeline>span")).toHaveText(/^0 \/ /);
  expect(await inspectState(page)).toEqual(start);
  await page.getByRole("button", { name: "Movimiento siguiente" }).click();
  await expect(
    page.getByRole("button", { name: "Movimiento anterior" }),
  ).toBeEnabled();
  expect(await inspectState(page)).toEqual(halfway);
  expect(errors).toEqual([]);
});

test("custom FRU changes manual turns and user algorithms without changing cube identity", async ({
  page,
}) => {
  await prepare(page);
  await page.getByText("Orientación", { exact: true }).click();
  await page.getByText("Cambiar orientación", { exact: true }).click();
  await page.getByLabel("Frente (F)", { exact: true }).selectOption("R");
  await page.getByLabel("Arriba (U)", { exact: true }).selectOption("D");
  await expect(page.getByText("R será rojo", { exact: true })).toBeVisible();
  const before = await inspectState(page);
  await page
    .getByRole("button", { name: "Establecer F y U", exact: true })
    .click();
  expect(await inspectState(page)).toEqual(before);
  await page.getByText("Explorar con giros manuales", { exact: true }).click();
  await page.getByRole("button", { name: "R", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Deshacer", exact: true }),
  ).toBeEnabled();
  const after = await inspectState(page);
  const { applyMove, applySequence } = await import("../src/cube/moves");
  expect(after).toEqual(applyMove(before, "F"));
  await page
    .getByText("Practicar un algoritmo con esta orientación", { exact: true })
    .click();
  await page.getByLabel("Mi algoritmo", { exact: true }).fill("R' D' R D");
  await page
    .getByRole("button", { name: "Ver pasos de mi algoritmo", exact: true })
    .click();
  await expect(page.locator(".move-tokens button")).toHaveText([
    "R'",
    "D'",
    "R",
    "D",
  ]);
  await page.getByRole("button", { name: "Final de la demostración" }).click();
  expect(await inspectState(page)).toEqual(
    applySequence(after, ["F'", "U'", "F", "U"]),
  );
  await page.getByLabel("Arriba (U)", { exact: true }).selectOption("L");
  await expect(
    page.getByRole("button", { name: "Establecer F y U", exact: true }),
  ).toBeDisabled();
});

test("camera orientation proposal needs confirmation and does not change physical state", async ({
  page,
}) => {
  await prepare(page);
  const before = await inspectState(page);
  const caption = await page.locator(".orientation-summary").textContent();
  const canvas = page.locator("canvas");
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width * 0.5,
    bounds.y + bounds.height * 0.5,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.85,
    bounds.y + bounds.height * 0.6,
    { steps: 12 },
  );
  await page.mouse.up();
  await page.getByText("Orientación", { exact: true }).click();
  await page.getByText("Cambiar orientación", { exact: true }).click();
  await page
    .getByRole("button", {
      name: "Proponer F y U desde esta vista",
      exact: true,
    })
    .click();
  const front = await page
      .getByLabel("Frente (F)", { exact: true })
      .inputValue(),
    up = await page.getByLabel("Arriba (U)", { exact: true }).inputValue();
  const { validReference } = await import("../src/cube/reference");
  expect(validReference({ front: front as any, up: up as any })).toBe(true);
  expect(await page.locator(".orientation-summary").textContent()).toEqual(
    caption,
  );
  expect(await inspectState(page)).toEqual(before);
  await page
    .getByRole("button", { name: "Establecer F y U", exact: true })
    .click();
  expect(await inspectState(page)).toEqual(before);
});

test("explore before scrambling with buttons and keyboard without intercepting inputs", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
  await page.getByText("Herramientas de desarrollo", { exact: true }).click();
  await page
    .getByLabel("Inspeccionar identidades, posiciones y orientación")
    .check();
  const original = await inspectState(page);
  const manual = page.locator(".manual-controls");
  await expect(
    manual.getByRole("button", { name: "R", exact: true }),
  ).toBeVisible();
  await manual.getByRole("button", { name: "R", exact: true }).click();
  await expect(
    manual.getByRole("button", { name: "Deshacer", exact: true }),
  ).toBeEnabled();
  expect(await inspectState(page)).not.toEqual(original);
  await expect(
    page.getByRole("button", { name: "Empezar tutorial" }),
  ).toBeEnabled();
  await page.keyboard.press("Control+z");
  await expect(
    manual.getByRole("button", { name: "Rehacer", exact: true }),
  ).toBeEnabled();
  expect(await inspectState(page)).toEqual(original);
  await page.keyboard.press("Control+Shift+z");
  await expect(
    manual.getByRole("button", { name: "Rehacer", exact: true }),
  ).toBeDisabled();
  await manual.getByRole("button", { name: "Deshacer", exact: true }).click();
  await expect(
    manual.getByRole("button", { name: "Deshacer", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("u");
  await expect(
    manual.getByRole("button", { name: "Deshacer", exact: true }),
  ).toBeEnabled();
  expect(await inspectState(page)).not.toEqual(original);
  await page.keyboard.press("Shift+u");
  await expect(
    manual.getByRole("button", { name: "U", exact: true }),
  ).toBeEnabled();
  expect(await inspectState(page)).toEqual(original);
  await page.locator(".debug-content input").first().fill("R U");
  expect(await inspectState(page)).toEqual(original);
  await page.reload();
  await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
  await expect(page.locator(".manual-controls")).toBeVisible();
});

test("camera control is centralized and its preference survives reload without moving pieces", async ({
  page,
}) => {
  await prepare(page);
  const original = await inspectState(page);
  const center = page.locator(".control-center");
  await expect(
    center.getByRole("button", { name: "Cámara automática" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    center.getByRole("button", { name: "Perspectiva doble" }),
  ).toBeVisible();
  await center.getByText("Ayudas visuales", { exact: true }).click();
  await expect(
    center.getByRole("button", { name: "Mostrar ejes" }),
  ).toBeVisible();
  await expect(
    center.getByRole("button", { name: "Cámara automática" }),
  ).not.toBeVisible();
  await center.getByText("Vista", { exact: true }).click();
  await center.getByRole("button", { name: "Cámara automática" }).click();
  expect(await inspectState(page)).toEqual(original);
  await page.reload();
  await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
  await expect(
    center.getByRole("button", { name: "Cámara automática" }),
  ).toHaveAttribute("aria-pressed", "false");
  await center.getByRole("button", { name: "Cámara automática" }).click();
  await expect(
    center.getByRole("button", { name: "Cámara automática" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("fixed stage view places yellow above and persists through turns and reload", async ({
  page,
}) => {
  await prepare(page);
  await page.getByLabel("Modo de cámara").selectOption("stage");
  const original = await inspectState(page);
  await page.getByLabel(/^Etapa/).selectOption("3");
  await page.getByRole("button", { name: "Ir a etapa", exact: true }).click();
  await expect(page.locator(".view-label")).toContainText("amarillo arriba");
  expect(await inspectState(page)).toEqual(original);
  await page.getByText("Explorar con giros manuales", { exact: true }).click();
  await page
    .locator(".manual-controls")
    .getByRole("button", { name: "R", exact: true })
    .click();
  await expect(
    page
      .locator(".manual-controls")
      .getByRole("button", { name: "Deshacer", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".view-label")).toContainText("amarillo arriba");
  await expect(page.locator(".orbit-hint")).toContainText(
    "Vista fija de etapa",
  );
  await page.reload();
  await page.getByRole("button", { name: "Expandir ajustes del cubo" }).click();
  await expect(page.getByLabel("Modo de cámara")).toHaveValue("stage");
  await expect(page.locator(".view-label")).toContainText("amarillo arriba");
  await page
    .locator(".cube-workspace")
    .screenshot({ path: "artifacts/fixed-yellow-view.png" });
});
