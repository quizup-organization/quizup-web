import { expect, test } from "@playwright/test"
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  playUntil,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Revue des questions depuis l'écran de résultat : en **desktop**, le duel vit dans un
 * mockup tablette paysage (`[data-slot=duel-frame]`) et la revue est un overlay **dans**
 * ce cadre ; en **tactile**, plein écran + bottom sheet Arc. Navigation manche par manche
 * (flèches) puis fermeture — sans rechargement ni fetch supplémentaire.
 */
test("duel bot : revue des questions depuis le résultat", async ({
  browser,
}) => {
  const errors: string[] = []
  const context = await browser.newContext()
  const page = await context.newPage()
  attachErrorCapture(page, errors)

  await register(page, uniqueEmail("review"))

  await page.goto(`${BASE}/topics`, { waitUntil: "domcontentloaded" })
  await page
    .locator(".animate-pulse")
    .first()
    .waitFor({ state: "hidden", timeout: 30_000 })
    .catch(() => {})
  await page.locator('[data-slot="topic-card"]').first().click()
  await page.waitForURL(/\/topics\/[^/]+$/, { timeout: 30_000 })

  await page.getByRole("button", { name: "Lancer un duel" }).click()
  await page.getByRole("button", { name: /Défier un Bot/ }).click()
  await page.getByRole("button", { name: "Suivant" }).click()
  await page.getByRole("button", { name: /Normal/ }).click()
  await page.getByRole("button", { name: "Lancer" }).click()

  await page.waitForURL(/\/duel\/[^/]+$/, { timeout: 30_000 })
  await playUntil(page, "FIN DU DUEL")

  const openReview = page.getByRole("button", {
    name: "Ouvrir la revue des questions",
  })

  // Desktop : cadre tablette paysage (4:3), contenu dans le viewport.
  const frame = page.locator('[data-slot="duel-frame"]')
  const overlay = page.locator('[data-slot="review-overlay"]')
  await expect(frame).toBeVisible()
  const viewport = (await page.viewportSize())!
  const frameBox = (await frame.boundingBox())!
  expect(frameBox.width, "cadre duel plus étroit que le viewport").toBeLessThan(
    viewport.width
  )
  expect(
    Math.abs(frameBox.width / frameBox.height - 4 / 3),
    "cadre duel au ratio 4:3"
  ).toBeLessThan(0.02)

  // Revue desktop : overlay **dans** le cadre (pas de modale flottante).
  await openReview.click()
  await expect(overlay).toBeVisible({ timeout: 15_000 })
  await expect(
    page.getByRole("heading", { name: "Questions", exact: true })
  ).toBeVisible()
  await expect(page.getByText("QUESTION 1 : 7")).toBeVisible()
  const overlayBox = (await overlay.boundingBox())!
  expect(
    overlayBox.x,
    "overlay confiné au cadre (gauche)"
  ).toBeGreaterThanOrEqual(frameBox.x - 1)
  expect(
    overlayBox.y,
    "overlay confiné au cadre (haut)"
  ).toBeGreaterThanOrEqual(frameBox.y - 1)
  expect(
    overlayBox.x + overlayBox.width,
    "overlay confiné au cadre (droite)"
  ).toBeLessThanOrEqual(frameBox.x + frameBox.width + 1)
  expect(
    overlayBox.y + overlayBox.height,
    "overlay confiné au cadre (bas)"
  ).toBeLessThanOrEqual(frameBox.y + frameBox.height + 1)

  // Navigation clavier ←/→ en desktop.
  await page.keyboard.press("ArrowRight")
  await expect(page.getByText("QUESTION 2 : 7")).toBeVisible()

  await page.getByRole("button", { name: "Fermer la revue" }).click()
  await expect(page.getByText("QUESTION 1 : 7")).toBeHidden()

  // Tactile : plein écran (pas de cadre) + bottom sheet Arc.
  await page.setViewportSize({ width: 393, height: 852 })
  const phoneFrameBox = (await frame.boundingBox())!
  expect(
    phoneFrameBox.width,
    "tactile : pas de cadre, le duel remplit l'écran"
  ).toBeGreaterThanOrEqual(392)
  await openReview.click()
  await expect(page.getByText("QUESTION 1 : 7")).toBeVisible({
    timeout: 15_000,
  })
  await expect(overlay).toBeHidden()
  await page.getByRole("button", { name: "Fermer la revue" }).click()
  await expect(page.getByText("QUESTION 1 : 7")).toBeHidden()

  await expect(page.getByText("FIN DU DUEL")).toBeVisible()

  assertNoConsoleErrors(errors)

  await context.close()
})
