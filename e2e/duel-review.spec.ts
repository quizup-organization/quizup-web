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
 * Revue des questions depuis l'écran de résultat : ouverture de l'overlay, navigation
 * manche par manche (flèches) puis fermeture — sans rechargement ni fetch supplémentaire.
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

  await page.getByRole("button", { name: "DETAILS" }).click()
  await expect(page.getByText("QUESTIONS", { exact: true })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText("QUESTION 1 : 7")).toBeVisible()

  await page.getByRole("button", { name: "Question suivante" }).click()
  await expect(page.getByText("QUESTION 2 : 7")).toBeVisible()

  await page.getByRole("button", { name: "Fermer la revue" }).click()
  await expect(page.getByText("QUESTION 1 : 7")).toBeHidden()
  await expect(page.getByText("FIN DU DUEL")).toBeVisible()

  assertNoConsoleErrors(errors)

  await context.close()
})
